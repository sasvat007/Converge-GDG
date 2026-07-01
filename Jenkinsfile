pipeline {
    agent any

    environment {
        // Name of the container image we will build
        IMAGE_NAME = "converge-gdg-backend"
        IMAGE_TAG  = "${env.BUILD_ID}"
        
        // Target the specific folder containing the Spring Boot app
        BACKEND_DIR = "backend/chatbot" 
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling the latest code from GitHub...'
                checkout scm
            }
        }

        stage('Build & Unit Test') {
            steps {
                echo 'Navigating to backend directory and compiling Spring Boot...'
                // The dir() block tells Jenkins to run these commands inside your backend folder
                dir("${BACKEND_DIR}") {
                    // Ensure the mvnw file has execute permissions in Git!
                    sh 'chmod +x mvnw'
                    sh './mvnw clean package -DskipTests=false'
                }
            }
        }

        stage('SCA: Dependency Analysis') {
            steps {
                echo 'Scanning pom.xml dependencies for known vulnerabilities...'
                dir("${BACKEND_DIR}") {
                    // This requires the owasp-dependency-check plugin to be added to your pom.xml
                    sh './mvnw org.owasp:dependency-check-maven:check'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building the Docker container for the backend...'
                dir("${BACKEND_DIR}") {
                    // Assumes your Dockerfile is located inside backend/chatbot
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Container Security Scan (Trivy)') {
            steps {
                echo 'Scanning the Docker image with Trivy...'
                // Fails the pipeline if HIGH or CRITICAL vulnerabilities are found
                sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline execution complete.'
        }
        success {
            echo 'Security checks passed! Image is ready for deployment.'
        }
        failure {
            echo 'Pipeline failed. Please check the logs for failing tests or security vulnerabilities.'
        }
    }
}