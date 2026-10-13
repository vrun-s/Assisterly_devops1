pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME = 'assisterly'
        IMAGE_NAME = 'assisterly:latest'
        CONTAINER_NAME = 'assisterly-app'
        APP_PORT = '5000'
        PYTHONUNBUFFERED = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '=== Stage 1: Checking out source code ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Stage 2: Installing Python dependencies in isolated virtualenv ==='
                script {
                    if (isUnix()) {
                        sh '''
                            python3 -m venv venv || python -m venv venv
                            . venv/bin/activate
                            pip install --upgrade pip
                            pip install -r requirements.txt
                        '''
                    } else {
                        bat '''
                            if not exist venv ( python -m venv venv )
                            call venv\\Scripts\\activate
                            python -m pip install --upgrade pip
                            pip install -r requirements.txt
                        '''
                    }
                }
            }
        }

        stage('Run Automated Tests') {
            steps {
                echo '=== Stage 3: Executing Pytest test suite ==='
                script {
                    if (isUnix()) {
                        sh '''
                            . venv/bin/activate
                            pytest -v --junitxml=test-results.xml
                        '''
                    } else {
                        bat '''
                            call venv\\Scripts\\activate
                            pytest -v --junitxml=test-results.xml
                        '''
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'test-results.xml'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "=== Stage 4: Building Docker image ${env.IMAGE_NAME} ==="
                script {
                    if (isUnix()) {
                        sh "docker build -t ${IMAGE_NAME} ."
                    } else {
                        bat "docker build -t %IMAGE_NAME% ."
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                echo '=== Stage 5: Deploying container with persistent SQLite volume ==='
                script {
                    if (isUnix()) {
                        sh '''
                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true
                            docker volume create assisterly_data || true
                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                -p ${APP_PORT}:5000 \
                                -v assisterly_data:/app/data \
                                --restart unless-stopped \
                                ${IMAGE_NAME}

                            # Verify health endpoint
                            sleep 5
                            curl --fail --retry 5 --retry-delay 2 http://localhost:${APP_PORT}/api/health || {
                                echo "Deployment verification failed!"
                                docker logs ${CONTAINER_NAME}
                                exit 1
                            }
                            echo "Deployment verified: /api/health responding 200 OK"
                        '''
                    } else {
                        bat '''
                            docker stop %CONTAINER_NAME% 2>nul || ver>nul
                            docker rm %CONTAINER_NAME% 2>nul || ver>nul
                            docker volume create assisterly_data 2>nul || ver>nul
                            docker run -d --name %CONTAINER_NAME% -p %APP_PORT%:5000 -v assisterly_data:/app/data --restart unless-stopped %IMAGE_NAME%
                            timeout /t 5 /nobreak
                            curl --fail http://localhost:%APP_PORT%/api/health || exit /b 1
                            echo Deployment verified: /api/health responding 200 OK
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline Succeeded: Assisterly is tested, built, and deployed."
        }
        failure {
            echo "CI/CD Pipeline Failed: Tests or build validation halted pipeline execution."
        }
    }
}
