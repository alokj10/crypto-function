cd /projects/crypto-function

git pull

container_id=`docker ps -a --filter "name=crypto-function" --format "{{.ID}}"`
echo 'containerId:' $container_id
docker stop $container_id

docker container prune -f

image_id=`docker images --format="{{.Repository}} {{.ID}}" | grep "crypto-function" | cut -d " " -f2`
echo 'imageId:' $image_id
docker rmi $image_id

docker image prune -f
