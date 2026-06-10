pipeline {
    agent any

    environment {
        CONTAINER_NAME = 'pharm-frontend-ui'
        IMAGE_NAME     = 'pharm-frontend'
        NETWORK_NAME   = 'pharmeasy-network'
        PORT_MAPPING   = '4202:80'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Forward host proxy settings into the Docker build so npm can reach registry.npmjs.org
                    def proxyArgs = ''
                    if (env.HTTP_PROXY)  proxyArgs += " --build-arg HTTP_PROXY=${env.HTTP_PROXY}"
                    if (env.HTTPS_PROXY) proxyArgs += " --build-arg HTTPS_PROXY=${env.HTTPS_PROXY}"
                    if (env.NO_PROXY)    proxyArgs += " --build-arg NO_PROXY=${env.NO_PROXY}"

                    bat "docker build --no-cache ${proxyArgs} -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    // Ensure shared Docker network exists
                    bat "docker network create ${NETWORK_NAME} 2>nul || ver >nul"

                    // Stop and remove the named container if it already exists
                    bat "docker stop ${CONTAINER_NAME} 2>nul || ver >nul"
                    bat "docker rm   ${CONTAINER_NAME} 2>nul || ver >nul"

                    // Launch the new container
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
                    // Give nginx a moment to start, then verify the container is still running
                    sleep(time: 5, unit: 'SECONDS')
                    def status = bat(
                        script: "docker inspect -f {{.State.Running}} ${CONTAINER_NAME}",
                        returnStdout: true
                    ).trim()
                    if (!status.contains('true')) {
                        error "Container ${CONTAINER_NAME} failed to start. Check docker logs."
                    }
                    echo "Container is healthy and running on port 4202."
                }
            }
        }
    }

    post {
        success {
            echo "✅ pharm-frontend pipeline completed successfully! App is live at http://localhost:4202"
        }
        failure {
            echo "❌ pharm-frontend pipeline failed. Check the logs above for details."
            // Dump container logs if the container exists
            bat "docker logs ${CONTAINER_NAME} 2>nul || ver >nul"
        }
        always {
            // Remove dangling/untagged images to keep the Docker host clean
            bat "docker image prune -f 2>nul || ver >nul"
        }
    }
}
