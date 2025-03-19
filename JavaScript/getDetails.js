const params = new URL(location.href).searchParams;
const productId = params.get('productId');
let quantity = document.getElementById("productCount");
let productImage;
getData()
async function getData(){
    try {
        let response = await fetch('json/products.json');
        let json = await response.json();
        let product = json.find(item => item.id == productId); 

        if (product) {
            displayDetails(product);
        } else {
            console.error('Product not found');
        }
    } catch (error) {
        console.error('Error fetching the data', error);
    }
}
function displayDetails(product) {
    let productDetails = document.getElementsByClassName('productDetails')[0];
    productDetails.setAttribute("data-id", product.id);
    productImage = product.images[0]; // Assign the product image URL to the variable
    console.log("Product Image URL:", product.images[0]); // Log the image URL
    document.getElementById("product_image").src = product.images[0];
    document.querySelector(".category_name").innerHTML = product.category;
    document.querySelector(".product_name").innerHTML = product.name;
    document.querySelector(".product_price").innerHTML = product.price;
    document.querySelector(".product_des").innerHTML = product.description;

    // Select "Try On" button using class instead of ID
    const tryOnButton = document.querySelector(".try-on-btn");
    if (tryOnButton) { 
        if (["Accessories", "Bag", "Jewelry"].includes(product.category)) {
            tryOnButton.style.display = "none";  // Hide button for specific categories
        } else {
            tryOnButton.style.display = "block"; // Show for other categories
        }
    }

    const linkAdd = document.getElementById("btn_add");
    linkAdd.addEventListener('click', function(event) {
        event.preventDefault();
        addToCart(product.id, parseInt(quantity.value) || 1);
        showToast();
    });
}

function openWebcam() {
    let videoElement = document.getElementById('webcam-video');
    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.id = 'webcam-video';
        videoElement.autoplay = true;
        document.body.appendChild(videoElement);
    }
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
            const pose = new Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });
            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: true,
                smoothSegmentation: true,
            });
            pose.onResults(onPoseResults);

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    await pose.send({ image: videoElement });
                },
            });
            camera.start();
        })
        .catch(err => {
            console.error("Error accessing webcam: ", err);
            alert("Could not access the webcam. Please check your permissions.");
        });
}

function onPoseResults(results) {
    const canvas = document.getElementById('output-canvas');
    const ctx = canvas.getContext('2d');
    const videoElement = document.getElementById('webcam-video');
    canvas.width = videoElement.clientWidth;
    canvas.height = videoElement.clientHeight;
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });

        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        const midpointX = ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width;
        const midpointY = ((leftShoulder.y + rightShoulder.y) / 2) * canvas.height;
        const width = Math.abs((rightShoulder.x - leftShoulder.x) * canvas.width * 1.5);
        const height = width * 1.2;

        overlayProductImage(midpointX, midpointY, width, height);
    }
}

function overlayProductImage(x, y, width, height) {
    const canvas = document.getElementById('output-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = productImage;
    canvas.style.display = 'block';
   // console.log(img.width, img.height);
    // ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    // ctx.fillRect(x - width / 2, y - height / 3, width, height);
    // img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.99;
        ctx.drawImage(img, x - width / 2, y - height / 7, width, height);
    // };
    img.onerror = () => console.error("Failed to load product image:", img.src);
}
