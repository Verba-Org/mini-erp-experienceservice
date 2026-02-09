import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaxConfig } from 'src/messages/entities/tax-config.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaxCalculator {
  constructor(
    @InjectRepository(TaxConfig)
    private taxConfigRepository: Repository<TaxConfig>,
  ) {}

  async calculate(
    country: string,
    subtotal: number,
  ): Promise<{
    rate: number;
    taxAmount: number;
    total: number;
    taxType: string;
  }> {
    const taxConfig = await this.taxConfigRepository.findOne({
      where: { country },
    });
    const rate = taxConfig ? Number(taxConfig.rate) / 100 : 0;
    const taxAmount = subtotal * rate;
    return {
      rate: rate * 100, // as percentage
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat((subtotal + taxAmount).toFixed(2)),
      taxType: taxConfig ? taxConfig.tax_type : 'N/A',
    };
  }
}
