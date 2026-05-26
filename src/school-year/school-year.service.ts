import { Injectable } from '@nestjs/common';
import { SchoolYearDTO } from './school-year.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';

@Injectable()
export class SchoolYearService {

    constructor(private prisma:PrismaService){}

    async getSchoolYears() {

        try {
            const schoolYears = await this.prisma.schoolYear.findMany();

            return schoolYears;
        } catch (error) {
            badResponse.message = String(error);
            return badResponse;
        }

    }

    async createSchoolYear(data: SchoolYearDTO) {

        try {
            const schoolYear = await this.prisma.schoolYear.create({
                data: {
                    name: data.name,
                    startDate: data.startDate,
                    endDate: data.endDate
                }
            });

            return schoolYear;

        } catch (error) {
            badResponse.message = String(error);
            return badResponse;
        }
    }

    // Periods
    async getPeriods() {

        try {
            const periods = await this.prisma.period.findMany();

            return periods;
        } catch (error) {
            badResponse.message = String(error);
            return badResponse;
        }
    }

    // High School Levels
    async getHighSchoolLevels() {

        try {
            const highSchoolLevels = await this.prisma.highSchoolLevel.findMany();

            return highSchoolLevels;
        } catch (error) {
            badResponse.message = String(error);
            return badResponse;
        }
    }

    // Sections
    async getSections() {

        try {
            const sections = await this.prisma.section.findMany();

            return sections;
        } catch (error) {
            badResponse.message = String(error);
            return badResponse;
        }

    }

}
