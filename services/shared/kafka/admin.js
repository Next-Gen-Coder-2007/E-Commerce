import createKafkaClient from './kafkaClient.js';
import { ALL_TOPICS } from './topics.js';

export const initKafkaTopics = async (numPartitions = 3, replicationFactor = 1) => {
  const kafka = createKafkaClient('topic-provisioner');
  const admin = kafka.admin();

  try {
    console.log('[Kafka Admin] Connecting to Kafka broker to verify/create topics...');
    await admin.connect();

    const existingTopics = await admin.listTopics();
    const topicsToCreate = ALL_TOPICS.filter((t) => !existingTopics.includes(t)).map((topic) => ({
      topic,
      numPartitions,
      replicationFactor,
      configEntries: [
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'retention.ms', value: '604800000' }, // 7 days
      ],
    }));

    if (topicsToCreate.length > 0) {
      console.log(`[Kafka Admin] Creating ${topicsToCreate.length} missing topic(s):`, topicsToCreate.map((t) => t.topic));
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      console.log('[Kafka Admin] All topics provisioned successfully.');
    } else {
      console.log(`[Kafka Admin] All ${ALL_TOPICS.length} required topics already exist.`);
    }

    await admin.disconnect();
    return { success: true, createdCount: topicsToCreate.length };
  } catch (error) {
    console.warn('[Kafka Admin] Topic provisioning bypassed/failed:', error.message);
    try {
      await admin.disconnect();
    } catch {}
    return { success: false, error: error.message };
  }
};

// Run directly if invoked from CLI
if (process.argv[1]?.includes('admin.js') || process.argv[1]?.includes('initTopics')) {
  initKafkaTopics().then((res) => {
    console.log('[Kafka Admin] Result:', res);
    process.exit(0);
  });
}
