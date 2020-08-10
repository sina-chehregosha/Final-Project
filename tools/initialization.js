const User = require("../models/user");
const bcrypt = require('bcryptjs');

const initialization = async function()  {
    try {
        const EXIST_ADMIN = await User.findOne({role: 'admin'});
        if (EXIST_ADMIN) {
            return console.log('Admin already created');
        };

        const ADMIN = new User({
            firstName: 'Sina',
            lastName: 'Chehregosha',
            password: '12345678',
            email: 's.chehregosha@yahoo.com',
            mobileNumber: '09190898858',
            sex: 'male',
            role: 'admin',   
        });

        // Hash password
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(ADMIN.password, salt, (err, hashed) => {
                if (err) throw err;
                // set password to hashed
                ADMIN.password = hashed;

                ADMIN.save()
                console.log('Admin created');
            });
        });
        
    } catch (err) {
        console.log('Error in initialization function', err);
    };
};

module.exports = initialization;