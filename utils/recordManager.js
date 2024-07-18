import { PostgresRecordManager } from "@langchain/community/indexes/postgres";

async function RecordManager({ tableName }) {
  const recordManagerConfig = {
    postgresConnectionOptions: {
      type: "postgres",
      host: "127.0.0.1",
      port: 5432,
      user: "postgres",
      password: "123456",
      database: "postgres",
    },
    tableName,
  };

  const recordManager = new PostgresRecordManager(
    tableName,
    recordManagerConfig
  );

  await recordManager.createSchema();

  return recordManager;
}

export { RecordManager };
