import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import Patient from '../schemas/patient.schema';
import { Order } from '../schemas/order.schema';
import Test from '../schemas/test.schema';
import { Result } from '../schemas/result.schema';
import { SampleModel } from '../models/Sample.model';
import User from '../schemas/user.schema';

const generateSampleData = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('Generating sample data...');

    // Get admin user for references
    const adminUser = await User.findOne({ email: 'admin@lis.com' });
    if (!adminUser) {
      return res.status(404).json(new ApiResponse(404, 'Admin user not found'));
    }

    // Sample patient
    const patient = new Patient({
      patientId: `PT${Date.now()}`,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'male',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phoneNumber: '+1234567891'
      },
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      medicalHistory: [],
      isActive: true,
      createdBy: adminUser._id
    });
    await patient.save();

    // Create diverse sample tests for each category
    const sampleTests = [
      // Hematology
      { name: 'Complete Blood Count', code: 'CBC', category: 'Hematology', description: 'Complete blood count with differential', price: 25.00, turnaroundTime: 24, normalRange: { min: 4.5, max: 11.0 }, unit: 'K/uL' },
      { name: 'Hemoglobin A1c', code: 'HBA1C', category: 'Hematology', description: 'Glycated hemoglobin test', price: 15.00, turnaroundTime: 48, normalRange: { min: 4.0, max: 5.6 }, unit: '%' },
      { name: 'Platelet Count', code: 'PLT', category: 'Hematology', description: 'Platelet count analysis', price: 12.00, turnaroundTime: 12, normalRange: { min: 150, max: 450 }, unit: 'K/uL' },

      // Biochemistry
      { name: 'Lipid Panel', code: 'LP', category: 'Biochemistry', description: 'Comprehensive lipid panel', price: 35.00, turnaroundTime: 48, normalRange: { min: 0, max: 200 }, unit: 'mg/dL' },
      { name: 'Liver Function Test', code: 'LFT', category: 'Biochemistry', description: 'Comprehensive liver function panel', price: 45.00, turnaroundTime: 24, normalRange: { min: 7, max: 56 }, unit: 'U/L' },
      { name: 'Kidney Function Test', code: 'KFT', category: 'Biochemistry', description: 'Kidney function panel', price: 30.00, turnaroundTime: 24, normalRange: { min: 0.5, max: 1.3 }, unit: 'mg/dL' },
      { name: 'Glucose Fasting', code: 'GLU', category: 'Biochemistry', description: 'Fasting blood glucose', price: 10.00, turnaroundTime: 6, normalRange: { min: 70, max: 100 }, unit: 'mg/dL' },

      // Microbiology
      { name: 'Blood Culture', code: 'BC', category: 'Microbiology', description: 'Blood culture for bacterial detection', price: 80.00, turnaroundTime: 72, normalRange: { text: 'No growth' }, unit: 'N/A' },
      { name: 'Urine Culture', code: 'UC', category: 'Microbiology', description: 'Urine culture analysis', price: 40.00, turnaroundTime: 48, normalRange: { text: 'No growth' }, unit: 'N/A' },
      { name: 'Throat Swab Culture', code: 'TSC', category: 'Microbiology', description: 'Throat swab for bacterial detection', price: 35.00, turnaroundTime: 48, normalRange: { text: 'No growth' }, unit: 'N/A' },

      // Immunology
      { name: 'COVID-19 PCR', code: 'COVID', category: 'Immunology', description: 'COVID-19 PCR test', price: 120.00, turnaroundTime: 24, normalRange: { text: 'Not detected' }, unit: 'N/A' },
      { name: 'HIV Test', code: 'HIV', category: 'Immunology', description: 'HIV antibody test', price: 50.00, turnaroundTime: 60, normalRange: { text: 'Non-reactive' }, unit: 'N/A' },
      { name: 'Hepatitis B', code: 'HEP B', category: 'Immunology', description: 'Hepatitis B surface antigen', price: 45.00, turnaroundTime: 60, normalRange: { text: 'Negative' }, unit: 'N/A' },
      { name: 'Thyroid Panel', code: 'THY', category: 'Immunology', description: 'Comprehensive thyroid panel', price: 55.00, turnaroundTime: 24, normalRange: { min: 0.4, max: 4.0 }, unit: 'mIU/L' },

      // Pathology
      { name: 'Pap Smear', code: 'PAP', category: 'Pathology', description: 'Pap smear cervical screening', price: 60.00, turnaroundTime: 72, normalRange: { text: 'Negative' }, unit: 'N/A' },
      { name: 'Biopsy', code: 'BIO', category: 'Pathology', description: 'Tissue biopsy examination', price: 150.00, turnaroundTime: 96, normalRange: { text: 'Benign' }, unit: 'N/A' },
      { name: 'Fine Needle Aspiration', code: 'FNA', category: 'Pathology', description: 'Fine needle aspiration cytology', price: 100.00, turnaroundTime: 72, normalRange: { text: 'Benign' }, unit: 'N/A' },

      // Cardiology
      { name: 'ECG', code: 'ECG', category: 'Cardiology', description: 'Electrocardiogram', price: 25.00, turnaroundTime: 6, normalRange: { text: 'Normal' }, unit: 'N/A' },
      { name: 'Echocardiogram', code: 'ECHO', category: 'Cardiology', description: 'Transthoracic echocardiogram', price: 200.00, turnaroundTime: 24, normalRange: { text: 'Normal' }, unit: 'N/A' },
      { name: 'Stress Test', code: 'ETT', category: 'Cardiology', description: 'Exercise stress test', price: 300.00, turnaroundTime: 12, normalRange: { text: 'Normal' }, unit: 'N/A' },

      // Other (General)
      { name: 'Vitamin D', code: 'VITD', category: 'Other', description: 'Vitamin D level test', price: 35.00, turnaroundTime: 24, normalRange: { min: 30, max: 100 }, unit: 'ng/mL' },
      { name: 'Vitamin B12', code: 'B12', category: 'Other', description: 'Vitamin B12 level', price: 25.00, turnaroundTime: 24, normalRange: { min: 200, max: 900 }, unit: 'pg/mL' },
      { name: 'Iron Studies', code: 'IRON', category: 'Other', description: 'Complete iron panel', price: 40.00, turnaroundTime: 24, normalRange: { min: 50, max: 170 }, unit: 'μg/dL' },
      { name: 'ESR', code: 'ESR', category: 'Other', description: 'Erythrocyte sedimentation rate', price: 8.00, turnaroundTime: 12, normalRange: { min: 0, max: 20 }, unit: 'mm/hr' },
      { name: 'CRP', code: 'CRP', category: 'Other', description: 'C-reactive protein', price: 15.00, turnaroundTime: 6, normalRange: { min: 0, max: 5 }, unit: 'mg/L' }
    ];

    const createdTests = [];
    for (const testData of sampleTests) {
      const test = new Test({
        testName: testData.name,
        testCode: testData.code,
        category: testData.category,
        description: testData.description,
        normalRange: testData.normalRange,
        unit: testData.unit,
        price: testData.price,
        turnaroundTime: { value: testData.turnaroundTime, unit: 'hours' },
        specimenType: 'blood',
        preparationInstructions: testData.category === 'Biochemistry' ? 'Fasting required' : 'No special preparation',
        isActive: true,
        createdBy: adminUser._id
      });
      await test.save();
      createdTests.push(test);
    }

    console.log(`Created ${createdTests.length} sample tests`);

    // Create a sample order with some of the created tests
    const selectedTests = [
      {
        test: createdTests[0]._id, // CBC
        testName: createdTests[0].testName,
        testCode: createdTests[0].testCode,
        category: createdTests[0].category,
        price: createdTests[0].price
      },
      {
        test: createdTests[4]._id, // LFT
        testName: createdTests[4].testName,
        testCode: createdTests[4].testCode,
        category: createdTests[4].category,
        price: createdTests[4].price
      },
      {
        test: createdTests[1]._id, // HBA1C
        testName: createdTests[1].testName,
        testCode: createdTests[1].testCode,
        category: createdTests[1].category,
        price: createdTests[1].price
      }
    ];

    const subtotal = selectedTests.reduce((sum, test) => sum + test.price, 0);
    const taxAmount = subtotal * 0.08; // 8% tax
    const finalAmount = subtotal + taxAmount;

    const order = new Order({
      orderNumber: `ORD${Date.now()}`,
      patient: patient._id,
      tests: selectedTests,
      referringDoctor: 'Dr. Sarah Johnson',
      clinicalNotes: 'Routine health checkup with metabolic panel',
      priority: 'routine',
      status: 'pending',
      paymentStatus: 'paid',
      subtotal,
      taxAmount,
      finalAmount,
      createdBy: adminUser._id
    });
    await order.save();

    // Create a sample result for one of the tests
    const result = new Result({
      order: order._id,
      patient: patient._id,
      test: createdTests[0]._id, // CBC
      testName: createdTests[0].testName,
      testCode: createdTests[0].testCode,
      value: '7.2',
      valueType: 'number',
      unit: 'K/uL',
      normalRange: createdTests[0].normalRange,
      isAbnormal: false,
      criticalValue: false,
      status: 'completed',
      analysisDate: new Date(),
      enteredBy: adminUser._id,
      notes: 'Sample normal result - WBC within normal range'
    });
    await result.save();

    // Create a few more orders for variety
    for (let i = 0; i < 3; i++) {
      const testPatient = new Patient({
        patientId: `PT${Date.now() + i}`,
        firstName: `Patient${i + 1}`,
        lastName: 'Test',
        dateOfBirth: new Date('1990-01-01'),
        gender: i % 2 === 0 ? 'male' : 'female',
        email: `patient${i + 1}@test.com`,
        phone: `+123456789${i}`,
        isActive: true,
        createdBy: adminUser._id
      });
      await testPatient.save();

      const testOrder = new Order({
        orderNumber: `ORD${Date.now() + i}`,
        patient: testPatient._id,
        tests: [{
          test: createdTests[0]._id,
          testName: createdTests[0].testName,
          testCode: createdTests[0].testCode,
          category: createdTests[0].category,
          price: createdTests[0].price
        }],
        referringDoctor: 'Dr. Johnson',
        priority: i === 0 ? 'urgent' : 'routine',
        status: i === 0 ? 'completed' : 'pending',
        paymentStatus: 'paid',
        subtotal: 25.00,
        taxAmount: 2.00,
        finalAmount: 27.00,
        createdBy: adminUser._id
      });
      await testOrder.save();
    }

    console.log('Sample data generated successfully!');

    res.status(200).json(
      new ApiResponse(200, 'Sample data generated successfully', {
        patients: 4,
        orders: 4,
        tests: 2,
        results: 1
      })
    );
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }
});

export { generateSampleData };