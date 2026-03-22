"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
try {
    const schema = zod_1.z.string({ required_error: 'Required' });
    console.log('Success with required_error');
}
catch (e) {
    console.log('Failed with required_error');
}
try {
    const schema2 = zod_1.z.string({ message: 'Required' });
    console.log('Success with message');
}
catch (e) {
    console.log('Failed with message');
}
