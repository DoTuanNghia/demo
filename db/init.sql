-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS taskdb;
USE taskdb;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean existing records to avoid duplicates on restart (optional)
DELETE FROM tasks;

-- Insert initial sample tasks for learning Docker and deployment
INSERT INTO tasks (title, description, status, due_date, created_at) VALUES
('Install Ubuntu VM', 'Set up an Ubuntu virtual machine on VirtualBox, VMware, or AWS EC2 to practice deployment.', 'DONE', CURDATE() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
('Write backend Dockerfile', 'Create a multi-stage Dockerfile for the Spring Boot application using Maven to build and JRE to run.', 'IN_PROGRESS', CURDATE() + INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY),
('Write frontend Dockerfile', 'Create a multi-stage Dockerfile for the React Vite frontend using Node.js to build and Nginx to serve the app.', 'TODO', CURDATE() + INTERVAL 3 DAY, NOW()),
('Orchestrate with Docker Compose', 'Write a docker-compose.yml file to tie together MySQL, backend, and frontend containers into a local network.', 'TODO', CURDATE() + INTERVAL 4 DAY, NOW()),
('Setup CI/CD pipeline', 'Create a GitHub Actions workflow that compiles code, builds Docker images, pushes to registry, and deploys to Ubuntu VM.', 'TODO', CURDATE() + INTERVAL 7 DAY, NOW());
