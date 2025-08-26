import React from 'react';
import styled from 'styled-components';
import { Search, Calendar } from 'lucide-react';

const FiltersContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const DateInput = styled(Input)`
  padding-left: 36px;
`;

const SearchInput = styled(Input)`
  padding-left: 36px;
`;


const IconWrapper = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  z-index: 1;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const CheckboxLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

export interface FiltersState {
  search: string;
  dateFrom: string;
  dateTo: string;
  labName: string;
  outOfRangeOnly: boolean;
}

interface ResultsFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

const ResultsFilters: React.FC<ResultsFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: keyof FiltersState, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <FiltersContainer>
      <FiltersGrid>
        <FilterGroup>
          <Label htmlFor="search">Поиск по показателю</Label>
          <InputWrapper>
            <IconWrapper>
              <Search size={16} />
            </IconWrapper>
            <SearchInput
              id="search"
              type="text"
              placeholder="Название показателя..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </InputWrapper>
        </FilterGroup>

        <FilterGroup>
          <Label htmlFor="dateFrom">Дата от</Label>
          <InputWrapper>
            <IconWrapper>
              <Calendar size={16} />
            </IconWrapper>
            <DateInput
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </InputWrapper>
        </FilterGroup>

        <FilterGroup>
          <Label htmlFor="dateTo">Дата до</Label>
          <InputWrapper>
            <IconWrapper>
              <Calendar size={16} />
            </IconWrapper>
            <DateInput
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </InputWrapper>
        </FilterGroup>

        <FilterGroup>
          <CheckboxWrapper>
            <Checkbox
              id="outOfRangeOnly"
              type="checkbox"
              checked={filters.outOfRangeOnly}
              onChange={(e) => handleFilterChange('outOfRangeOnly', e.target.checked)}
            />
            <CheckboxLabel htmlFor="outOfRangeOnly">
              Только вне нормы
            </CheckboxLabel>
          </CheckboxWrapper>
        </FilterGroup>
      </FiltersGrid>
    </FiltersContainer>
  );
};

export default ResultsFilters;