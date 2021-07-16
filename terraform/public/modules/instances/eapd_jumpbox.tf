variable "eapd_jumpbox_ami" {}
variable "eapd_jumpbox_instance_type" {}
variable "eapd_jumpbox_key_name_bb" {}
variable "eapd_jumpbox_key_name_tf" {}
variable "eapd_jumpbox_vpc_security_group_ids" {}
variable "eapd_jumpbox_subnet_id" {}
variable "eapd_jumpbox_associate_public_ip_address" {}

data "aws_ami" "latest_golden_image" {
    most_recent = true
    owners = ["842420567215"]
        filter {
            name = "name"
            values = ["EAST-RH 7-9 Gold Image V.*"]
        }
        filter {
            name   = "virtualization-type"
            values = ["hvm"]
        }
}

resource "aws_instance" "eapd_jumpbox_bb" {

    ami                         = data.aws_ami.latest_golden_image.id
    instance_type               = var.eapd_jumpbox_instance_type
    key_name                    = var.eapd_jumpbox_key_name_bb
    vpc_security_group_ids      = var.eapd_jumpbox_vpc_security_group_ids
    subnet_id                   = var.eapd_jumpbox_subnet_id
    associate_public_ip_address = var.eapd_jumpbox_associate_public_ip_address
    tags = {
        Name = "eAPD Jumpbox BB"
    }
}

resource "aws_instance" "eapd_jumpbox_tf" {

    ami                         = data.aws_ami.latest_golden_image.id
    instance_type               = var.eapd_jumpbox_instance_type
    key_name                    = var.eapd_jumpbox_key_name_tf
    vpc_security_group_ids      = var.eapd_jumpbox_vpc_security_group_ids
    subnet_id                   = var.eapd_jumpbox_subnet_id
    associate_public_ip_address = var.eapd_jumpbox_associate_public_ip_address
    tags = {
        Name = "eAPD Jumpbox TF"
    }
}
