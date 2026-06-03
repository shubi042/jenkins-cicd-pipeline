pipeline {
  agent any

  environment {
    APP_NAME      = 'myapp'
    ECR_REGISTRY  = '123456789.dkr.ecr.us-east-1.amazonaws.com'
    IMAGE_NAME    = "${ECR_REGISTRY}/${APP_NAME}"
    IMAGE_TAG     = "${BUILD_NUMBER}-${GIT_COMMIT[0..7]}"
    HELM_CHART    = './helm'
    SONAR_PROJECT = 'myapp'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git log -1 --format="%H %s" | tee .git-info'
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test -- --coverage --coverageReporters=text-summary'
      }
      post {
        always {
          publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'coverage/lcov-report',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
          ])
        }
      }
    }

    stage('Code Quality') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh """
            sonar-scanner \
              -Dsonar.projectKey=${SONAR_PROJECT} \
              -Dsonar.sources=src \
              -Dsonar.tests=tests \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
          """
        }
      }
    }

    stage('Docker Build') {
      steps {
        script {
          docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "--build-arg BUILD_DATE=\$(date -u +%Y-%m-%dT%H:%M:%SZ) .")
          docker.build("${IMAGE_NAME}:latest", ".")
        }
      }
    }

    stage('Push to ECR') {
      steps {
        withCredentials([aws(credentialsId: 'aws-credentials', region: 'us-east-1')]) {
          sh """
            aws ecr get-login-password --region us-east-1 | \
              docker login --username AWS --password-stdin ${ECR_REGISTRY}
            docker push ${IMAGE_NAME}:${IMAGE_TAG}
            docker push ${IMAGE_NAME}:latest
          """
        }
      }
    }

    stage('Deploy to Dev') {
      when { branch 'develop' }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh """
            helm upgrade --install ${APP_NAME} ${HELM_CHART} \
              -f ${HELM_CHART}/values-dev.yaml \
              --set image.tag=${IMAGE_TAG} \
              --namespace myapp-dev \
              --create-namespace \
              --wait --timeout 5m
          """
        }
      }
    }

    stage('Smoke Test') {
      when { branch 'develop' }
      steps {
        sh 'chmod +x scripts/smoke-test.sh && ./scripts/smoke-test.sh dev'
      }
    }

    stage('Deploy to Prod') {
      when { branch 'main' }
      steps {
        input message: "Deploy ${IMAGE_TAG} to production?", ok: 'Deploy'
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh """
            helm upgrade --install ${APP_NAME} ${HELM_CHART} \
              -f ${HELM_CHART}/values-prod.yaml \
              --set image.tag=${IMAGE_TAG} \
              --namespace myapp-prod \
              --create-namespace \
              --wait --timeout 10m
          """
        }
        sh './scripts/smoke-test.sh prod'
      }
    }
  }

  post {
    success {
      echo "Pipeline succeeded — ${IMAGE_NAME}:${IMAGE_TAG} deployed"
    }
    failure {
      echo "Pipeline failed — check logs above"
    }
    always {
      sh 'docker image prune -f'
      cleanWs()
    }
  }
}