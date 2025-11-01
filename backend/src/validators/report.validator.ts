import { ReportZodSchema as BaseReportZodSchema } from './schemas';

export const ReportZodSchema = {
  create: BaseReportZodSchema.create,
  update: BaseReportZodSchema.update,
  approve: BaseReportZodSchema.approve,
  share: BaseReportZodSchema.share
};