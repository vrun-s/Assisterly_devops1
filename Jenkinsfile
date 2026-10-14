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
        DATA_VOLUME = 'assisterly_data'
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
                echo '=== Stage 2: Installing Python dependencies ==='
                script {
                    if (isUnix()) {
                        sh '''
                            python3 -m venv venv
                            . venv/bin/activate
                            python -m pip install --upgrade pip
                            pip install -r requirements.txt
                        '''
                    } else {
                        bat '''
                            if not exist venv (
                                python -m venv venv
                            )
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
                    junit allowEmptyResults: true,
                          testResults: 'test-results.xml'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "=== Stage 4: Building Docker image ${env.IMAGE_NAME} ==="
                script {
                    if (isUnix()) {
                        sh '''
                            docker build -t "$IMAGE_NAME" .
                        '''
                    } else {
                        bat '''
                            docker build -t %IMAGE_NAME% .
                        '''
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                echo '=== Stage 5: Deploying container ==='

                script {
                    if (isUnix()) {
                        sh '''
                            set -eu

                            docker volume create "$DATA_VOLUME"

                            docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

                            docker run -d \
                                --name "$CONTAINER_NAME" \
                                -p "$APP_PORT:5000" \
                                -v "$DATA_VOLUME:/app/data" \
                                -e PORT=5000 \
                                -e HOST=0.0.0.0 \
                                -e DATABASE_PATH=/app/data/assisterly.db \
                                -e FLASK_ENV=production \
                                --restart unless-stopped \
                                "$IMAGE_NAME"

                            echo "Waiting for application health check..."

                            attempt=1
                            while [ "$attempt" -le 10 ]; do
                                if curl --fail --silent \
                                    "http://localhost:$APP_PORT/api/health"; then
                                    echo ""
                                    echo "Deployment verified successfully."
                                    exit 0
                                fi

                                if ! docker inspect \
                                    --format='{{.State.Running}}' \
                                    "$CONTAINER_NAME" 2>/dev/null \
                                    | grep -q true; then
                                    echo "Container stopped unexpectedly."
                                    docker logs "$CONTAINER_NAME" || true
                                    exit 1
                                fi

                                echo "Health check attempt $attempt failed."
                                sleep 3
                                attempt=$((attempt + 1))
                            done

                            echo "Deployment health check failed."
                            docker logs "$CONTAINER_NAME" || true
                            exit 1
                        '''
                    } else {
                        bat '''
                            @echo off
                            docker volume create %DATA_VOLUME%
                            if errorlevel 1 exit /b 1

                            docker rm -f %CONTAINER_NAME% 2>nul

                            docker run -d --name %CONTAINER_NAME% -p %APP_PORT%:5000 -v %DATA_VOLUME%:/app/data -e PORT=5000 -e HOST=0.0.0.0 -e DATABASE_PATH=/app/data/assisterly.db -e FLASK_ENV=production --restart unless-stopped %IMAGE_NAME%

                            if errorlevel 1 (
                                echo Failed to start Docker container.
                                exit /b 1
                            )

                            echo Waiting for application health check...

                            powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok = $false; for ($i = 1; $i -le 10; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host $r.Content; $ok = $true; break } } catch { Write-Host ('Health check attempt ' + $i + ' failed: ' + $_.Exception.Message) }; Start-Sleep -Seconds 3 }; if (-not $ok) { exit 1 }"

                            if errorlevel 1 (
                                echo Deployment health check failed.
                                docker logs %CONTAINER_NAME%
                                exit /b 1
                            )

                            echo Deployment verified successfully.
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'CI/CD Pipeline Succeeded: Assisterly was tested, built, deployed, and health-checked.'
        }
        failure {
            echo 'CI/CD Pipeline Failed. Check the failed stage and its console output.'
        }
        always {
            echo 'Pipeline execution completed.'
        }
    }
}