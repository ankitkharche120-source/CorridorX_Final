const fs = require('fs');
const path = require('path');
const config = require('../config');
const { generateSeedData } = require('./seedData');

class Database {
  constructor() {
    this.dbPath = path.resolve(process.cwd(), config.dbFilePath);
    this.data = null;
    this.init();
  }

  init() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.dbPath)) {
      this.data = generateSeedData();
      this.persist();
      console.log(`[DB] Database initialized and seeded at ${this.dbPath}`);
    } else {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        console.log(`[DB] Database loaded from ${this.dbPath}`);
      } catch (err) {
        console.error('[DB] Error loading database file, re-seeding...', err);
        this.data = generateSeedData();
        this.persist();
      }
    }
  }

  persist() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Failed to persist database to disk:', err);
    }
  }

  // Generic collection helpers
  collection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return {
      find: (predicate = () => true) => {
        return this.data[name].filter(predicate);
      },
      findOne: (predicate) => {
        return this.data[name].find(predicate) || null;
      },
      findById: (id) => {
        return this.data[name].find(item => item.id === id) || null;
      },
      insert: (record) => {
        this.data[name].push(record);
        this.persist();
        return record;
      },
      update: (id, updates) => {
        const index = this.data[name].findIndex(item => item.id === id);
        if (index === -1) return null;
        this.data[name][index] = { ...this.data[name][index], ...updates };
        this.persist();
        return this.data[name][index];
      },
      delete: (id) => {
        const index = this.data[name].findIndex(item => item.id === id);
        if (index === -1) return false;
        this.data[name].splice(index, 1);
        this.persist();
        return true;
      }
    };
  }

  get users() { return this.collection('users'); }
  get ambulances() { return this.collection('ambulances'); }
  get hospitals() { return this.collection('hospitals'); }
  get trips() { return this.collection('trips'); }
  get routeNodes() { return this.collection('routeNodes'); }
  get digitalBoards() { return this.collection('digitalBoards'); }
}

const db = new Database();
module.exports = db;
