const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/')
  .then(async () => {
    console.log('Connected to database');

    const db = mongoose.connection.db;
    const reportsCollection = db.collection('reports');

    // Get all reports
    const allReports = await reportsCollection.find({}).toArray();
    console.log('Total reports in database:', allReports.length);

    // Update all reports to have isActive: true
    for (const report of allReports) {
      console.log('Report ' + (report.reportNumber || 'Unknown') + ' - isActive: ' + report.isActive);
      await reportsCollection.updateOne(
        { _id: report._id },
        { $set: { isActive: true } }
      );
      console.log('Updated report: ' + (report.reportNumber || 'Unknown'));
    }

    // Verify all reports now have isActive: true
    const activeReports = await reportsCollection.find({ isActive: true }).toArray();
    console.log('Reports with isActive: true:', activeReports.length);

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });