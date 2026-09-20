pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
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

        stage('Unit tests') {
            steps {
                gitlabCommitStatus(name: 'unit-tests') {
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
                        docker compose -f compose.ci.yaml run --rm -T unit-tests
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true,
                artifacts: 'coverage/**'
        }
    }
}
