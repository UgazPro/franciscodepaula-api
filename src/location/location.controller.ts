import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('countries')
  async getCountries() {
    return this.locationService.getCountries();
  }

  @Get('states')
  async getStates(@Query('countryId', ParseIntPipe) countryId: number) {
    return this.locationService.getStates(countryId);
  }

  @Get('municipalities')
  async getMunicipalities(
    @Query('stateId', ParseIntPipe) stateId: number,
  ) {
    return this.locationService.getMunicipalities(stateId);
  }

  @Get('parishes')
  async getParishes(
    @Query('municipalityId', ParseIntPipe) municipalityId: number,
  ) {
    return this.locationService.getParishes(municipalityId);
  }
}
