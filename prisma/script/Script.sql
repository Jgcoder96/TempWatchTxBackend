INSERT INTO sensors (id_sensors, name, date) VALUES
	(gen_random_uuid(), 'sensor_1', NOW()),
	(gen_random_uuid(), 'sensor_2', NOW()),
	(gen_random_uuid(), 'sensor_3', NOW()),
	(gen_random_uuid(), 'sensor_4', NOW());

SELECT id_sensors, name, date FROM sensors
	ORDER BY date DESC;