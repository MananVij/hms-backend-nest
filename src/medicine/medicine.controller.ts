import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { SearchMedicineDto } from './dto/search-medicine.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'src/interfaces/request.interface';

@Controller('medicines')
@UseGuards(JwtAuthGuard)
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get('search')
  async search(@Req() req: Request, @Query() query: SearchMedicineDto) {
    const userId = req.user?.uid;
    return this.medicineService.searchMedicines(query.query, userId);
  }
}
