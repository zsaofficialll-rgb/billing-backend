
import mongoose from 'mongoose';

// The URI provided by the user (I will act as if I am reading it from the environment or input)
// mongodb+srv://Qasimarain:<password>@cluster0.kkfbjfx.mongodb.net/billing_system?retryWrites=true&w=majority
// User said password is: password123 (from previous conversation turns, although they typed <db_password> in the prompt, I told them to use password123. Let's hope they did or I'll need to ask).
// Wait, looking back at Step 1565/1570, I told them to create user `admin` with `password123`.
// But in Step 1570 they pasted: `mongodb+srv://Qasimarain:<db_password>...`
// This suggests they might have a DIFFERENT username `Qasimarain` or they are just copying the provided string layout.
// Be careful. If they used `Qasimarain` as the username, they need the password for `Qasimarain`.
// If they followed my instructions, they created `admin`.
// Maybe they used `Qasimarain` as the username in the setup screen?

// Let's try to connect with the string they put in api.js?
// I don't have access to Vercel env vars.
// But I can try to guess or ask them.

const uri = 'mongodb+srv://superadmin:super123@cluster0.kkfbjfx.mongodb.net/billing_system?retryWrites=true&w=majority';

console.log('Testing connection to:', uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri)
    .then(() => {
        console.log('✅ SUCCESS! Connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ FAILED to connect:', err.message);
        process.exit(1);
    });
