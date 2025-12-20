const db = require('../utils/database');

class UserDao {
  async findByEmail(email) {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async findById(id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async create(userData) {
    const { name, email, password, role } = userData;
    const result = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return result.lastID;
  }

  async update(id, userData) {
    const { name, email, role } = userData;
    await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
      name,
      email,
      role,
      id,
    ]);
  }

  async updatePassword(id, hashedPassword) {
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  async delete(id) {
    await db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  async findAll() {
    return await db.all('SELECT id, name, email, role FROM users');
  }
}

module.exports = new UserDao();
