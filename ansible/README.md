# Ansible Automation Scripts

## list hosts
    ansible-playbook ./raspi-docker-update.yml -i ./hosts  --list-hosts

Just run the following to update all Raspberry Pis

    ansible-playbook ./raspi.yml -i ./hosts  --ask-become-pass

To only update docker image:

    ansible-playbook ./raspi-docker-update.yml -i ./hosts  --ask-become-pass
