// @ts-ignore
import Patient from '../schemas/patient.schema';
import { IPatient } from '../types/models.types';

export class PatientModel {
  // Basic CRUD operations
  static async create(patientData: Partial<IPatient>): Promise<IPatient> {
    return await Patient.create(patientData);
  }

  static async findById(id: string): Promise<IPatient | null> {
    return await Patient.findById(id).populate('assignedDoctor', 'firstName lastName email');
  }

  static async findByMRN(mrn: string): Promise<IPatient | null> {
    return await Patient.findOne({ mrn, isActive: true });
  }

  static async findByEmail(email: string): Promise<IPatient | null> {
    return await Patient.findOne({ email: email.toLowerCase(), isActive: true });
  }

  static async findByPhone(phone: string): Promise<IPatient | null> {
    return await Patient.findOne({
      $or: [
        { 'phones.number': phone },
        { 'emergencyContact.phone': phone }
      ],
      isActive: true
    });
  }

  static async findAll(filters: any = {}, options: any = {}): Promise<IPatient[]> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      ...queryFilters
    } = filters;

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let query: any = { isActive: true, ...queryFilters };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { mrn: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    return await Patient.find(query)
      .populate('assignedDoctor', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async updateById(id: string, updateData: Partial<IPatient>): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'firstName lastName email');
  }

  static async deleteById(id: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  static async countDocuments(filters: any = {}): Promise<number> {
    let query: any = { isActive: true, ...filters };

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { mrn: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
      delete query.search;
    }

    return await Patient.countDocuments(query);
  }

  // Specific methods for patient operations
  static async searchPatients(searchTerm: string, limit: number = 10): Promise<IPatient[]> {
    const query = {
      isActive: true,
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { mrn: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { 'phones.number': { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await Patient.find(query)
      .limit(limit)
      .populate('assignedDoctor', 'firstName lastName email')
      .sort({ lastName: 1, firstName: 1 });
  }

  static async getPatientWithOrders(patientId: string): Promise<IPatient | null> {
    return await Patient.findById(patientId)
      .populate({
        path: 'orders',
        match: { isActive: true },
        options: { sort: { createdAt: -1 } }
      })
      .populate('assignedDoctor', 'firstName lastName email');
  }

  static async getPatientWithResults(patientId: string, limit: number = 50): Promise<IPatient | null> {
    return await Patient.findById(patientId)
      .populate({
        path: 'testHistory',
        match: { isActive: true },
        populate: {
          path: 'test',
          select: 'name code category'
        },
        options: {
          sort: { createdAt: -1 },
          limit
        }
      })
      .populate('assignedDoctor', 'firstName lastName email');
  }

  static async updatePatientInfo(patientId: string, info: Partial<IPatient>): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        ...info,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
  }

  static async addMedicalCondition(patientId: string, condition: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        $addToSet: { medicalConditions: condition },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async removeMedicalCondition(patientId: string, condition: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        $pull: { medicalConditions: condition },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async addMedication(patientId: string, medication: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        $addToSet: { currentMedications: medication },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async removeMedication(patientId: string, medication: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        $pull: { currentMedications: medication },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async addAllergy(patientId: string, allergy: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        $addToSet: { allergies: allergy },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async removeAllergy(patientId: string, allergy: string): Promise<IPatient | null> {
    return await Patient.findByIdAndUpdate(
      patientId,
      {
        $pull: { allergies: allergy },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getPatientStatistics(dateRange?: { start: Date; end: Date }): Promise<any> {
    const matchQuery: any = { isActive: true };

    if (dateRange) {
      matchQuery.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const statistics = await Patient.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          totalPatients: [{ $count: "count" }],
          genderDistribution: [
            {
              $group: {
                _id: "$gender",
                count: { $sum: 1 }
              }
            }
          ],
          ageDistribution: [
            {
              $bucket: {
                groupBy: "$age",
                boundaries: [0, 18, 30, 45, 60, 100],
                default: "unknown",
                output: {
                  count: { $sum: 1 }
                }
              }
            }
          ],
          bloodTypeDistribution: [
            {
              $group: {
                _id: "$bloodType",
                count: { $sum: 1 }
              }
            }
          ],
          registrationTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m", date: "$createdAt" }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    return statistics[0];
  }

  static async getRecentPatients(days: number = 7, limit: number = 10): Promise<IPatient[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await Patient.find({
      isActive: true,
      createdAt: { $gte: cutoffDate }
    })
    .populate('assignedDoctor', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }
}

// Export the raw Patient schema and IPatient type for direct use
export { Patient, IPatient };