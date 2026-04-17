-- Insert sample users
INSERT INTO users (name, email, password, phone, role, skill, available, latitude, longitude, rating) VALUES 
('Abhinav Kumar', 'abhinav@gmail.com', '$2a$10$dXJ3SW6G7P50eS6BQjbwEOLkh2eVUkL9K5L0z5QYDqC3Lq5lGJsaa', '9876543210', 'CUSTOMER', NULL, 1, 18.5204, 73.8567, 4.5),
('Priya Agent', 'priya@gmail.com', '$2a$10$dXJ3SW6G7P50eS6BQjbwEOLkh2eVUkL9K5L0z5QYDqC3Lq5lGJsaa', '9876543211', 'WORKER', 'Cleaning', 1, 18.5300, 73.8500, 4.8),
('Raj Plumber', 'raj@gmail.com', '$2a$10$dXJ3SW6G7P50eS6BQjbwEOLkh2eVUkL9K5L0z5QYDqC3Lq5lGJsaa', '9876543212', 'WORKER', 'Plumbing', 1, 18.5150, 73.8600, 4.2),
('Sunita Electrician', 'sunita@gmail.com', '$2a$10$dXJ3SW6G7P50eS6BQjbwEOLkh2eVUkL9K5L0z5QYDqC3Lq5lGJsaa', '9876543213', 'WORKER', 'Electrical', 1, 18.5250, 73.8520, 4.9),
('Vikram Delivery', 'vikram@gmail.com', '$2a$10$dXJ3SW6G7P50eS6BQjbwEOLkh2eVUkL9K5L0z5QYDqC3Lq5lGJsaa', '9876543214', 'WORKER', 'Delivery', 1, 18.5100, 73.8650, 4.6),
('Neha Customer', 'neha@gmail.com', '$2a$10$dXJ3SW6G7P50eS6BQjbwEOLkh2eVUkL9K5L0z5QYDqC3Lq5lGJsaa', '9876543215', 'CUSTOMER', NULL, 1, 18.5220, 73.8580, 0);

-- Insert sample tasks
INSERT INTO tasks (title, description, category, budget, status, address, latitude, longitude, posted_by, assigned_to, created_at) VALUES 
('Home Cleaning', 'Need complete house cleaning for 3 bedroom flat', 'Cleaning', 800, 'OPEN', 'Pune - Baner', 18.5204, 73.8567, 1, NULL, NOW()),
('Plumbing Repair', 'Leaking tap in kitchen, needs immediate repair', 'Plumbing', 500, 'OPEN', 'Pune - Koregaon Park', 18.5300, 73.8500, 1, NULL, NOW()),
('Electrical Fitting', 'Install 5 new ceiling fans in apartment', 'Electrical', 1500, 'OPEN', 'Pune - Viman Nagar', 18.5150, 73.8600, 1, NULL, NOW()),
('WiFi Setup', 'Install new WiFi router and configure network', 'WiFi Fix', 300, 'ASSIGNED', 'Pune - Wakad', 18.5250, 73.8520, 6, 4, NOW()),
('Furniture Moving', 'Need to move sofa and bed to new apartment', 'Moving', 1200, 'OPEN', 'Pune - Aundh', 18.5100, 73.8650, 6, NULL, NOW()),
('Laundry Delivery', 'Pickup and drop laundry service', 'Delivery', 400, 'COMPLETED', 'Pune - Hinjewadi', 18.5180, 73.8490, 6, 2, NOW()),
('Window Cleaning', 'Deep clean all windows in the house', 'Cleaning', 600, 'OPEN', 'Pune - Kalyani Nagar', 18.5290, 73.8440, 1, NULL, NOW()),
('Cooking Service', 'Prepare gourmet dinner for 4 people', 'Cooking', 2000, 'OPEN', 'Pune - Indiranagar', 18.5230, 73.8510, 6, NULL, NOW()),
('Light Repair', 'General house repair and maintenance', 'Other', 900, 'ASSIGNED', 'Pune - Kothrud', 18.5120, 73.8570, 1, 3, NOW()),
('Kitchen Cleaning', 'Deep clean kitchen cabinets and appliances', 'Cleaning', 700, 'OPEN', 'Pune - Bavdhan', 18.5160, 73.8630, 6, NULL, NOW());

-- Insert sample bookings
INSERT INTO bookings (task_id, worker_id, status, accepted_at, completed_at) VALUES 
(4, 4, 'ACCEPTED', NOW(), NULL),
(6, 2, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9, 3, 'ACCEPTED', NOW(), NULL);

-- Insert sample reviews
INSERT INTO reviews (worker_id, customer_id, rating, comment, created_at) VALUES 
(2, 6, 5, 'Excellent service! Very professional and on time.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 6, 4, 'Good work, installed the WiFi quickly.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 4, 'Great electrician, knows his work well.', DATE_SUB(NOW(), INTERVAL 5 DAY));
