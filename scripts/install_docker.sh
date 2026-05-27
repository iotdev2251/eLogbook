#!/bin/bash

echo "🛠️  Starting Docker installation on Ubuntu..."

# Update system
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group (optional, requires logout to take effect)
# sudo usermod -aG docker $USER

echo "✅ Docker has been installed successfully!"
echo "💡 Note: You may need to logout and login again for group changes to take effect."
