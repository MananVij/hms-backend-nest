import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoriteMedicineService } from './favorite-medicine.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { Request } from 'src/interfaces/request.interface';

@Controller('favorite-medicines')
@UseGuards(JwtAuthGuard)
export class FavoriteMedicineController {
  constructor(private readonly favoriteService: FavoriteMedicineService) {}

  @Post()
  async addFavorite(@Req() req: Request, @Body() dto: AddFavoriteDto) {
    const userId = req.user?.uid;
    return this.favoriteService.addFavorite(userId, dto);
  }

  @Delete(':medicineId')
  async removeFavorite(
    @Req() req: Request,
    @Param('medicineId') medicineId: number,
  ) {
    const userId = req.user?.uid;
    return this.favoriteService.removeFavorite(userId, medicineId);
  }

  @Get()
  async getFavorites(@Req() req: Request) {
    const userId = req.user?.uid;
    return this.favoriteService.getFavorites(userId);
  }
}
