import re
from typing import Optional, Dict, Any, Tuple
from decimal import Decimal, InvalidOperation
import pint
from sqlalchemy.orm import Session
from app.models.analyte import Analyte, AnalyteMapping
from app.models.result import Result
from app.services.analyte_service import AnalyteService


class NormalizationService:
    def __init__(self, db: Session):
        self.db = db
        self.analyte_service = AnalyteService(db)
        
        # Инициализация Pint для конверсии единиц
        self.ureg = pint.UnitRegistry()
        self._setup_medical_units()
    
    def _setup_medical_units(self):
        """Настройка специфических медицинских единиц"""
        # Добавляем медицинские единицы в реестр Pint
        self.ureg.define('cell = 1 * count')  # Клетки
        self.ureg.define('IU = 1 * international_unit')  # Международные единицы
        self.ureg.define('U = 1 * unit')  # Единицы активности
        self.ureg.define('copies = 1 * count')  # Копии (для ПЦР)
        
        # Конверсии концентраций
        self.unit_conversions = {
            # Глюкоза: мг/дл -> ммоль/л
            'glucose': {
                'mg/dl': {'factor': 0.0555, 'target': 'mmol/l'},
                'mg/dL': {'factor': 0.0555, 'target': 'mmol/l'},
            },
            # Холестерин: мг/дл -> ммоль/л  
            'cholesterol': {
                'mg/dl': {'factor': 0.02586, 'target': 'mmol/l'},
                'mg/dL': {'factor': 0.02586, 'target': 'mmol/l'},
            },
            # Креатинин: мг/дл -> мкмоль/л
            'creatinine': {
                'mg/dl': {'factor': 88.4, 'target': 'μmol/l'},
                'mg/dL': {'factor': 88.4, 'target': 'μmol/l'},
            }
        }
    
    def normalize_result(self, result: Result) -> bool:
        """Нормализует результат анализа"""
        try:
            # 1. Найти соответствующий аналит
            analyte = self._find_analyte(result.source_label, result.document.lab_name)
            if analyte:
                result.analyte_id = analyte.id
            
            # 2. Извлечь числовое значение
            numeric_value = self._extract_numeric_value(result.raw_value)
            if numeric_value is not None:
                result.numeric_value = numeric_value
                result.is_numeric = True
            else:
                result.is_numeric = False
            
            # 3. Нормализовать единицы
            if result.raw_unit and result.is_numeric and analyte:
                normalized_unit, converted_value = self._normalize_units(
                    result.raw_unit, 
                    numeric_value, 
                    analyte.code
                )
                if normalized_unit and converted_value is not None:
                    result.normalized_unit = normalized_unit
                    result.numeric_value = converted_value
            
            # 4. Парсинг и нормализация референсных значений
            if result.raw_reference_range and analyte:
                ref_min, ref_max = self._parse_reference_range(
                    result.raw_reference_range,
                    result.normalized_unit or result.raw_unit
                )
                result.normalized_reference_min = ref_min
                result.normalized_reference_max = ref_max
            elif analyte and analyte.reference_ranges:
                # Использовать дефолтные референсы из справочника
                ref_min, ref_max = self._get_default_reference_ranges(analyte)
                result.normalized_reference_min = ref_min
                result.normalized_reference_max = ref_max
            
            # 5. Определить флаги отклонения
            if result.is_numeric and result.numeric_value:
                result.flag, result.is_out_of_range = self._calculate_flags(
                    result.numeric_value,
                    result.normalized_reference_min,
                    result.normalized_reference_max
                )
                
                # Проверка на подозрительные значения (>10x от референса)
                result.is_suspect = self._is_suspect_value(
                    result.numeric_value,
                    result.normalized_reference_min,
                    result.normalized_reference_max
                )
            
            # 6. Расчет дельты с предыдущим результатом
            self._calculate_delta(result)
            
            result.normalized = True
            result.processing_notes = {
                "normalized_at": "2024",  # TODO: использовать текущую дату
                "analyte_matched": analyte is not None,
                "unit_converted": result.normalized_unit != result.raw_unit if result.raw_unit else False
            }
            
            return True
            
        except Exception as e:
            result.processing_notes = {"error": str(e)}
            return False
    
    def _find_analyte(self, source_label: str, lab_name: Optional[str] = None) -> Optional[Analyte]:
        """Ищет соответствующий аналит по названию"""
        mappings = self.analyte_service.find_mappings(source_label, lab_name)
        if mappings and mappings[0]['confidence_score'] >= 0.8:
            return self.analyte_service.get_analyte(mappings[0]['analyte_id'])
        return None
    
    def _extract_numeric_value(self, raw_value: str) -> Optional[Decimal]:
        """Извлекает числовое значение из строки"""
        if not raw_value:
            return None
        
        # Убираем пробелы и приводим к нижнему регистру
        clean_value = raw_value.strip().lower()
        
        # Паттерны для различных форматов
        patterns = [
            r'(\d+[.,]\d+)',  # Десятичные числа
            r'(\d+)',         # Целые числа
            r'<\s*(\d+[.,]?\d*)',  # Меньше числа
            r'>\s*(\d+[.,]?\d*)',  # Больше числа
        ]
        
        for pattern in patterns:
            match = re.search(pattern, clean_value)
            if match:
                try:
                    # Заменяем запятую на точку для десятичных чисел
                    value_str = match.group(1).replace(',', '.')
                    return Decimal(value_str)
                except InvalidOperation:
                    continue
        
        return None
    
    def _normalize_units(self, raw_unit: str, value: Decimal, analyte_code: str) -> Tuple[Optional[str], Optional[Decimal]]:
        """Нормализует единицы измерения"""
        if not raw_unit or not analyte_code:
            return raw_unit, value
        
        # Очистка единицы
        clean_unit = raw_unit.strip().lower()
        
        # Проверяем есть ли специфичная конверсия для данного аналита
        if analyte_code in self.unit_conversions and clean_unit in self.unit_conversions[analyte_code]:
            conversion = self.unit_conversions[analyte_code][clean_unit]
            converted_value = value * Decimal(str(conversion['factor']))
            return conversion['target'], converted_value
        
        # Попытка конверсии через Pint (для стандартных единиц)
        try:
            # Нормализация обозначений единиц
            unit_mapping = {
                'г/л': 'g/l',
                'мг/л': 'mg/l',
                'ммоль/л': 'mmol/l',
                'мкмоль/л': 'μmol/l',
                'мкг/л': 'μg/l',
                'ед/л': 'U/l',
                'мед/л': 'mU/l'
            }
            
            normalized_unit = unit_mapping.get(clean_unit, clean_unit)
            
            # Проверяем, может ли Pint обработать единицу
            try:
                self.ureg(normalized_unit)
                return normalized_unit, value
            except:
                return raw_unit, value
                
        except Exception:
            return raw_unit, value
    
    def _parse_reference_range(self, raw_range: str, unit: Optional[str]) -> Tuple[Optional[Decimal], Optional[Decimal]]:
        """Парсит референсные значения"""
        if not raw_range:
            return None, None
        
        clean_range = raw_range.strip()
        
        # Паттерны для различных форматов референсов
        patterns = [
            r'(\d+[.,]\d*)\s*[-–—]\s*(\d+[.,]\d*)',  # Диапазон: 5.2-6.8
            r'<\s*(\d+[.,]\d*)',  # Меньше: < 5.0
            r'>\s*(\d+[.,]\d*)',  # Больше: > 2.5
            r'до\s*(\d+[.,]\d*)',  # До: до 40
            r'не более\s*(\d+[.,]\d*)',  # Не более
        ]
        
        # Диапазон
        match = re.search(patterns[0], clean_range)
        if match:
            try:
                min_val = Decimal(match.group(1).replace(',', '.'))
                max_val = Decimal(match.group(2).replace(',', '.'))
                return min_val, max_val
            except InvalidOperation:
                pass
        
        # Меньше чем
        match = re.search(patterns[1], clean_range)
        if match:
            try:
                max_val = Decimal(match.group(1).replace(',', '.'))
                return None, max_val
            except InvalidOperation:
                pass
        
        # Больше чем
        match = re.search(patterns[2], clean_range)
        if match:
            try:
                min_val = Decimal(match.group(1).replace(',', '.'))
                return min_val, None
            except InvalidOperation:
                pass
        
        return None, None
    
    def _get_default_reference_ranges(self, analyte: Analyte) -> Tuple[Optional[Decimal], Optional[Decimal]]:
        """Получает дефолтные референсные значения из справочника"""
        if not analyte.reference_ranges:
            return None, None
        
        # TODO: Учесть пол и возраст пациента в будущих версиях
        # Пока используем 'normal' или первый доступный диапазон
        ranges = analyte.reference_ranges
        
        if 'normal' in ranges:
            ref_data = ranges['normal']
        else:
            ref_data = list(ranges.values())[0]
        
        min_val = Decimal(str(ref_data.get('min'))) if ref_data.get('min') else None
        max_val = Decimal(str(ref_data.get('max'))) if ref_data.get('max') else None
        
        return min_val, max_val
    
    def _calculate_flags(self, value: Decimal, ref_min: Optional[Decimal], ref_max: Optional[Decimal]) -> Tuple[Optional[str], bool]:
        """Вычисляет флаги отклонения от нормы"""
        is_out_of_range = False
        flag = None
        
        if ref_min is not None and value < ref_min:
            flag = "L"  # Low
            is_out_of_range = True
        elif ref_max is not None and value > ref_max:
            flag = "H"  # High  
            is_out_of_range = True
        else:
            flag = "N"  # Normal
            is_out_of_range = False
        
        return flag, is_out_of_range
    
    def _is_suspect_value(self, value: Decimal, ref_min: Optional[Decimal], ref_max: Optional[Decimal]) -> bool:
        """Проверяет является ли значение подозрительно отклоняющимся (>10x)"""
        if ref_min is not None and value < ref_min:
            if ref_min > 0 and value / ref_min < Decimal('0.1'):
                return True
        
        if ref_max is not None and value > ref_max:
            if ref_max > 0 and value / ref_max > Decimal('10'):
                return True
        
        return False
    
    def _calculate_delta(self, result: Result):
        """Вычисляет дельту с предыдущим результатом того же аналита"""
        if not result.analyte_id or not result.is_numeric:
            return
        
        # Находим предыдущий результат для того же аналита
        previous_result = self.db.query(Result).filter(
            Result.analyte_id == result.analyte_id,
            Result.document_id != result.document_id,
            Result.is_numeric == True,
            Result.normalized == True
        ).join(Result.document).filter(
            Result.document.has(user_id=result.document.user_id)
        ).order_by(Result.created_at.desc()).first()
        
        if previous_result and previous_result.numeric_value:
            result.previous_result_id = previous_result.id
            result.delta_value = result.numeric_value - previous_result.numeric_value
            
            # Процентное изменение
            if previous_result.numeric_value != 0:
                result.delta_percent = (result.delta_value / previous_result.numeric_value) * 100