pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    parameters {
        string(
            name: 'BTTR_SERVER_REPOSITORY',
            defaultValue: 'git@gitlab:staging/bttr-server.git',
            description: 'Repositório Git que contém mock-api/.'
        )
        string(
            name: 'BTTR_SERVER_BRANCH',
            defaultValue: 'master',
            description: 'Branch do bttr-server usada pelos testes E2E.'
        )
    }

    triggers {
        gitlab(
            triggerOnPush: true,
            triggerOnMergeRequest: true,
            branchFilterType: 'All'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        stage('Checkout backend mock') {
            steps {
                dir('.ci/bttr-server') {
                    deleteDir()
                    git branch: params.BTTR_SERVER_BRANCH,
                        url: params.BTTR_SERVER_REPOSITORY
                }
            }
        }

        stage('Quality and unit tests') {
            steps {
                gitlabCommitStatus(name: 'quality') {
                    sh '''
                        command -v docker >/dev/null || {
                            echo 'O agente Jenkins precisa de Docker CLI e Compose v2.' >&2
                            exit 1
                        }
                        docker compose version
                        docker info >/dev/null

                        if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                            case "$WORKSPACE" in
                                "$JENKINS_HOME"/*)
                                    export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                    ;;
                                *)
                                    echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                    exit 1
                                    ;;
                            esac
                        fi

                        export CI_UID="$(id -u)" CI_GID="$(id -g)"
                        export COMPOSE_PROJECT_NAME="bttr-client-ci-$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)-$BUILD_NUMBER"
                        trap 'docker compose -f compose.ci.yaml down --remove-orphans' EXIT
                        docker compose -f compose.ci.yaml run --rm -T ci
                    '''
                }
            }
        }

        stage('E2E with backend mock') {
            options {
                timeout(time: 30, unit: 'MINUTES')
            }
            steps {
                gitlabCommitStatus(name: 'e2e') {
                    sh '''
                        command -v docker >/dev/null || {
                            echo 'O agente Jenkins precisa de Docker CLI e Compose v2.' >&2
                            exit 1
                        }
                        docker compose version
                        docker info >/dev/null

                        if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                            case "$WORKSPACE" in
                                "$JENKINS_HOME"/*)
                                    export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                    ;;
                                *)
                                    echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                    exit 1
                                    ;;
                            esac
                        fi

                        export CI_UID="$(id -u)" CI_GID="$(id -g)"
                        e2e_job_hash="$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)"
                        export COMPOSE_PROJECT_NAME="bttr-client-e2e-$e2e_job_hash-$BUILD_NUMBER"
                        export BTTR_MOCK_API_CONTEXT='.ci/bttr-server/mock-api'
                        export BTTR_MOCK_API_IMAGE="bttr-server-mock:$e2e_job_hash-$BUILD_NUMBER"

                        cleanup() {
                            exit_code=$?
                            if [ "$exit_code" -ne 0 ]; then
                                docker compose -f compose.e2e.yaml logs --no-color mock-api || true
                            fi
                            docker compose -f compose.e2e.yaml down --remove-orphans || true
                            exit "$exit_code"
                        }
                        trap cleanup EXIT

                        docker compose -f compose.e2e.yaml build mock-api
                        docker compose -f compose.e2e.yaml run --rm -T e2e
                    '''
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true,
                testResults: 'test-results/e2e-junit.xml'
            archiveArtifacts allowEmptyArchive: true,
                artifacts: 'coverage/**,playwright-report/**,test-results/**'
        }
    }
}
