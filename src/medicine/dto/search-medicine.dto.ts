import { IsString } from 'class-validator';

export class SearchMedicineDto {
  @IsString()
  query: string;
}
