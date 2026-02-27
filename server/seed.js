            // filepath: server/seed.js
            const mongoose = require('mongoose');
            const Bus = require('./models/Bus');
            const Student = require('./models/Student');
            require('dotenv').config();

            const seedData = async () => {
            await mongoose.connect(process.env.MONGO_URI);
            
            await Bus.deleteMany({});
            await Student.deleteMany({});
            
            // Sample buses
            const buses = [
             { id: 'R1', route: 'Rajroohpur', number: 'R1',
               status: 'active',
               coordinates: { lat: 25.4558, lng: 81.8663 }, heading: 45 },
             { id: 'D1', route: 'Dhoomanganj', number: 'D1',
               status: 'active',
               coordinates: { lat: 25.4360, lng: 81.8470 }, heading: 90 },
             { id: 'K2', route: 'Kareli', number: 'K2',
               status: 'active',
               coordinates: { lat: 25.4400, lng: 81.8500 } }
             // …more…
            ];
            await Bus.insertMany(buses);
            
            // Sample students
            const students = [
                { id: 'STU001', name: 'John Doe', registeredRoutes: ['Rajroohpur', 'Kareli', 'Dhoomanganj'] },
                { id: 'STU002', name: 'Adnan Attacker', registeredRoutes: ['Rajroohpur', 'Kareli', 'Dhoomanganj'] },
                { id: 'STU003', name: 'Sigma Sparsh', registeredRoutes: ['Rajroohpur', 'Kareli', 'Dhoomanganj'] },
                { id: 'STU004', name: 'Ayush Antman', registeredRoutes: ['Rajroohpur', 'Kareli', 'Dhoomanganj'] },
                { id: 'STU005', name: 'Johnny Jai', registeredRoutes: ['Rajroohpur', 'Kareli', 'Dhoomanganj'] }
                
                // Add more...
            ];
            await Student.insertMany(students);
            
            console.log('Data seeded');
            process.exit();
            };

            seedData();