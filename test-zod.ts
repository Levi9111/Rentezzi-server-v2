import { z } from 'zod';

try {
  const schema = z.string({ required_error: 'Required' });
  console.log('Success with required_error');
} catch (e) {
  console.log('Failed with required_error');
}

try {
  const schema2 = z.string({ message: 'Required' });
  console.log('Success with message');
} catch (e) {
  console.log('Failed with message');
}
