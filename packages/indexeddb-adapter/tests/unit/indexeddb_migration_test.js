// global variables
var get = Ember.get,
    App = {};

var store, database, migration, mock;

module('Unit/DS.IndexedDBMigration', {
  setup: function() {
    var env = {};

    database = window.indexedDB.open("AdapterTestDb", 1);

    var TestMigration = DS.IndexedDBMigration.extend({
      migrations: [
        function() {
        },
        function() {
        }
      ]
    });

    migration = TestMigration.create({
      databaseName: "migrationTestDb"
    });
  }
});

test('#lastVersion', function() {
  equal(migration.lastVersion(), 2, "Last version is correct");
});

test('#runMigrations', function() {
  mock = "";
  var TestMigration = DS.IndexedDBMigration.extend({
    migrations: [
      function() { mock = mock + "1"; },
      function() { mock = mock + "2"; }
    ]
  });

  migration = TestMigration.create();

  migration.runMigrations()
  equal(mock, "12", "Migrations were run in order");
});

test('#currentDbVersion', function() {
  stop();

  var promise = new Ember.RSVP.Promise(function(resolve, reject) {
    var deletion = window.indexedDB.deleteDatabase("migrationTestDb");

    deletion.onsuccess = function() {
      resolve();
    }
  });

  promise.then(function() {

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var db1 = indexedDB.open("migrationTestDb", 1);

      db1.onsuccess = function() {
        this.result.close();
        resolve();
      }
    });

  }).then(function() {

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var db999 = indexedDB.open("migrationTestDb", 999);
      db999.onsuccess = function() {
        this.result.close();
        resolve();
      }
    });

  }).then(function() {

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var version;

      migration = DS.IndexedDBMigration.extend().create({
        databaseName: "migrationTestDb"
      });

      version = migration.currentDbVersion();
      version.then(function(v) {
        equal(v, 999, "The current version is correct");
        start();
        resolve();
      });
    });

  }).then(function() {

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var deletion = window.indexedDB.deleteDatabase("migrationTestDb");

      deletion.onsuccess = function() {
        resolve();
      }
    });

  }).then(function() {
    stop();
    var version,
        db2 = indexedDB.open("migrationTestDb", 2);

    db2.onsuccess = function() {
      var _this = this;

      migration = DS.IndexedDBMigration.extend().create({
        databaseName: "migrationTestDb"
      });

      version = migration.currentDbVersion();
      version.then(function(v) {
        equal(v, 2, "The current version is correct after DB was reset");
        start();
        _this.result.close();
      });
    }
  });
});