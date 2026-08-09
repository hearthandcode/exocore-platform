// Exocore graph projection v1. PostgreSQL remains authority; this graph is rebuildable.
CREATE CONSTRAINT exocore_record_id IF NOT EXISTS
FOR (record:ExocoreRecord) REQUIRE record.record_id IS UNIQUE;

CREATE INDEX exocore_record_namespace IF NOT EXISTS
FOR (record:ExocoreRecord) ON (record.namespace);

CREATE INDEX exocore_record_kind IF NOT EXISTS
FOR (record:ExocoreRecord) ON (record.kind);

CREATE CONSTRAINT exocore_relation_id IF NOT EXISTS
FOR ()-[relation:EXOCORE_RELATION]-() REQUIRE relation.relation_id IS UNIQUE;
