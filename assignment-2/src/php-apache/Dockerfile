FROM php:8-apache
RUN apt-get update && apt-get install build-essential -y
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli
RUN apt-get install unzip -y


