const fs = require('fs');
const path = require('path');
const config = require('../config');
const { generateSeedData } = require('./seedData');

class Database {
  constructor() {
    this.dbPath = path.resolve(process.cwd(), config.dbFilePath || './data/database.json');
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
      this.ensureEntityCollections();
      this.persist();
      console.log(`[DB] Database initialized and seeded at ${this.dbPath}`);
    } else {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        this.ensureEntityCollections();
        console.log(`[DB] Database loaded from ${this.dbPath}`);
      } catch (err) {
        console.error('[DB] Error loading database file, re-seeding...', err);
        this.data = generateSeedData();
        this.ensureEntityCollections();
        this.persist();
      }
    }
  }

  ensureEntityCollections() {
    const requiredCollections = [
      'users',
      'customers',
      'drivers',
      'ambulances',
      'hospitals',
      'trips',
      'locations',
      'corridor_nodes',
      'corridor_events',
      'digital_boards',
      'board_events',
      'hospital_status',
      'notifications',
      'audit_logs'
    ];

    requiredCollections.forEach(col => {
      if (!this.data[col]) {
        this.data[col] = [];
      }
    });

    // Populate routeNodes alias if corridor_nodes is empty
    if (this.data.routeNodes && this.data.routeNodes.length > 0 && this.data.corridor_nodes.length === 0) {
      this.data.corridor_nodes = [...this.data.routeNodes];
    }
    // Populate digitalBoards alias if digital_boards is empty
    if (this.data.digitalBoards && this.data.digitalBoards.length > 0 && this.data.digital_boards.length === 0) {
      this.data.digital_boards = [...this.data.digitalBoards];
    }
  }

  persist() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Failed to persist database to disk:', err);
    }
  }

  // Generic collection helpers (simulates SQL table operations)
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
        const enrichedRecord = {
          ...record,
          created_at: record.created_at || new Date().toISOString()
        };
        this.data[name].push(enrichedRecord);
        this.persist();
        return enrichedRecord;
      },
      update: (id, updates) => {
        const index = this.data[name].findIndex(item => item.id === id);
        if (index === -1) return null;
        this.data[name][index] = { 
          ...this.data[name][index], 
          ...updates, 
          updated_at: new Date().toISOString() 
        };
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

  // Audit Logging
  logAudit(entityType, entityId, action, actorId = 'SYSTEM', metadata = {}) {
    return this.audit_logs.insert({
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_id: actorId,
      metadata_json: JSON.stringify(metadata),
      created_at: new Date().toISOString()
    });
  }

  // State Transition Logger for Trips
  recordTripTransition(tripId, fromStatus, toStatus, metadata = {}) {
    this.logAudit('TRIP', tripId, `STATUS_TRANSITION: ${fromStatus} -> ${toStatus}`, metadata.actorId || 'SYSTEM', metadata);
    return this.corridor_events.insert({
      id: `EVENT-${Date.now()}`,
      trip_id: tripId,
      event_type: 'TRIP_STATUS_CHANGED',
      from_status: fromStatus,
      to_status: toStatus,
      metadata_json: JSON.stringify(metadata),
      created_at: new Date().toISOString()
    });
  }

  // Explicit Collection Getters
  get users() { return this.collection('users'); }
  get customers() { return this.collection('customers'); }
  get drivers() { return this.collection('drivers'); }
  get ambulances() { return this.collection('ambulances'); }
  get hospitals() { return this.collection('hospitals'); }
  get trips() { return this.collection('trips'); }
  get locations() { return this.collection('locations'); }
  get corridor_nodes() { return this.collection('corridor_nodes'); }
  get routeNodes() { return this.collection('corridor_nodes'); }
  get corridor_events() { return this.collection('corridor_events'); }
  get digital_boards() { return this.collection('digital_boards'); }
  get digitalBoards() { return this.collection('digital_boards'); }
  get board_events() { return this.collection('board_events'); }
  get hospital_status() { return this.collection('hospital_status'); }
  get notifications() { return this.collection('notifications'); }
  get audit_logs() { return this.collection('audit_logs'); }
}

const db = new Database();
module.exports = db;
