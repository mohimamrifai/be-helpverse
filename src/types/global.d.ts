// Global declarations for TypeScript

declare module '*/config/db' {
  const connectDB: () => Promise<void>;
  export default connectDB;
}

declare module '*/routes/auth' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/routes/events' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/routes/orders' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/routes/admin' {
  import { Router } from 'express';
  const router: Router;
  export default router;
} 