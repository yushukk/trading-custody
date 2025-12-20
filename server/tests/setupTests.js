// 测试设置文件
console.log('Running tests in', process.env.NODE_ENV || 'test', 'environment');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.DATABASE_PATH = ':memory:'; // 使用内存数据库进行测试
