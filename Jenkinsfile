pipeline {
    agent any

    environment {
        CONTAINER_NAME  = 'pharmeasy-frontend'
        IMAGE_NAME      = 'pharmeasy-frontend'
        NETWORK_NAME    = 'pharmeasy-network'
        PORT_MAPPING    = '4201:80'
        // Legacy builder avoids contacting auth.docker.io on every build
        // (Sophos proxy blocks that endpoint on the corporate network).
        DOCKER_BUILDKIT = '0'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ── Install & Build on the Jenkins host ──────────────────────────────
        // npm is run on the Windows host where Sophos CA is already trusted by
        // the OS certificate store.  This avoids the "Exit handler never called"
        // crash that happens when npm makes hundreds of parallel HTTPS connections
        // through Sophos SSL inspection inside an Alpine Docker container.
        stage('Install Dependencies') {
            steps {
                bat 'npm install --no-audit --no-fund'
            }
        }

        stage('Build Angular App') {
            steps {
                bat 'npm run build'
            }
        }

        // ── Pull base images ─────────────────────────────────────────────────
        stage('Pull Base Images') {
            steps {
                script {
                    bat "docker pull nginx:alpine 2>nul || echo WARN: could not pull nginx:alpine, using local cache"
                }
            }
        }

        // ── Package pre-built dist/ into nginx image ─────────────────────────
        stage('Build Docker Image') {
            steps {
                script {
                    bat "docker build --no-cache -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    bat "docker network create ${NETWORK_NAME} 2>nul || ver >nul"

                    bat "docker stop ${CONTAINER_NAME} 2>nul || ver >nul"
                    bat "docker rm   ${CONTAINER_NAME} 2>nul || ver >nul"

                    bat """
                        docker run -d ^
                            --name ${CONTAINER_NAME} ^
                            --network ${NETWORK_NAME} ^
                            -p ${PORT_MAPPING} ^
                            --restart unless-stopped ^
                            ${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep(time: 5, unit: 'SECONDS')
                    def status = bat(
                        script: "docker inspect -f {{.State.Running}} ${CONTAINER_NAME}",
                        returnStdout: true
                    ).trim()
                    if (!status.contains('true')) {
                        error "Container ${CONTAINER_NAME} failed to start. Check: docker logs ${CONTAINER_NAME}"
                    }
                    echo "Frontend container is healthy and running on port 4201."
                }
            }
        }
    }

    post {
        success {
            echo "PharmEasy frontend pipeline completed successfully! App is live at http://localhost:4201"
        }
        failure {
            echo "PharmEasy frontend pipeline failed. Check the logs above for details."
            bat "docker logs ${CONTAINER_NAME} 2>nul || ver >nul"
        }
        always {
            bat "docker image prune -f 2>nul || ver >nul"
        }
    }
}
