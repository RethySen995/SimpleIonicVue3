<!-- eslint-disable no-async-promise-executor -->
<!-- eslint-disable no-async-promise-executor -->
<template src="@/shared/components/mapcomponent/map.component.html">
    
</template>
<script lang="ts">
import { COMMON_KEY } from '@/assets/mock/branchLists.const';
import { ModalService } from '@/shared/services/modal.service';
import { defineComponent } from 'vue';
declare let window: any;
declare let document: any;
declare let google: any;
let userLocationMarker: any;
declare let navigator:any;
let polyline: any;
let infowindow: any;
export default defineComponent({
    name: 'MapComponent',
    data() {
        return {
            lang: '',
            apiKey: '',
            map: new Object as any,
            modalService: new ModalService(),
            markerList: new Array<any>()
        }
    },
    methods: {
        getLocationLatLng(lat: any, lng: any) {
            return new google.maps.LatLng(lat, lng);
        },
        async loadScriptIntoDOM() {
            if (window.google && window.google.maps) {
                document.querySelectorAll('script[src^="https://maps.googleapis.com"]').forEach((s: any) => {
                    s.remove();
                });
                delete window.google.maps;
            }
            const script = document.createElement('script');
            if (this.apiKey) {
                script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&language=${this.lang}&region=KH&callback=googleMapsAPILoaded`);
            } else {
                script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?language=${this.lang}&region=KH&callback=googleMapsAPILoaded`);
            }
            script.setAttribute("defer", "");
            script.setAttribute("async", "");
            document.head.appendChild(script);
        },
        async injectMapSDK(): Promise<boolean> {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve) => {
                if (!window.google || !window.google.maps) {
                    window.googleMapsAPILoaded = () => {
                        resolve(true);
                    };
                    await this.loadScriptIntoDOM();
                } else {
                    window.googleMapsAPILoaded = () => {
                        resolve(true);
                    };
                    await this.loadScriptIntoDOM();
                }
            });
        },
        async initMap(lat: any, lng: any): Promise<any> {
            const map = await new Promise((resolve) => {
                const mapOptions = {
                    mapTypeControl: false,
                    disableDefaultUI: true,
                    draggable: true,
                    center: new google.maps.LatLng(lat, lng),
                    zoom: 13,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                this.map = new google.maps.Map(document.getElementById("mapElement") as HTMLElement, mapOptions);
                resolve(this.map);
            });
            return map;
        },
        async getUserCurrentLocation(): Promise<any> {
            const currentLocation = await new Promise((resolve) => {
                function SuccessCallback(result: any) {
                    resolve({
                        lat: result.coords.latitude,
                        lng: result.coords.longitude,
                    });
                }
                function ErrorCallback(result: any) {
                    resolve({
                        lat: 0,
                        lng: 0,
                        errCode: result.code,
                        errMessage: result.message
                    });
                }
                const mapOptions = {
                    maximumAge: 60000,
                    timeout: 2000,
                    enableHighAccuracy: true,
                };
                navigator.geolocation.getCurrentPosition(SuccessCallback, ErrorCallback, mapOptions);
            });
            return currentLocation;
        },
        async setUserLocation() {
            await this.getUserCurrentLocation().then(async (res) => {
                if ( res.errCode && res.errMessage ) {
                    this.modalService.modalAlert({
                        message: res.errMessage,
                        callback:() => {
                            // this.$logger.info('User Current Location:' + JSON.stringify(res));
                            return;
                        }
                    });
                }
                this.$logger.info('User Current Location:' + JSON.stringify(res));
                await this.initMap(res.lat, res.lng).then((result: boolean) => {
                    this.map = result;
                    if (result) {
                        userLocationMarker = new google.maps.Marker({
                            map: result,
                            // animation: google.maps.Animation.DROP,
                            clickable: false,
                            position: new google.maps.LatLng(res.lat, res.lng),
                            icon: require('@/assets/images/ico_map_my.svg'),
                            shadow: null,
                            zIndex: 99999,
                            title: 'Current Location'
                        });
                        userLocationMarker.setPosition(this.getLocationLatLng(res.lat, res.lng));
                        // this.map.panTo(this.getLocationLatLng(res.lat, res.lng));
                        // this.map.setZoom(16);
                        // Load other Markers on Map
                        this.setMarkerLists(COMMON_KEY.branchLists);
                    }
                }).catch((err: any) => {
                    this.modalService.modalAlert({
                        header: err.name,
                        message: err.message
                    });
                });
            }).catch((err: any) => {
                this.modalService.modalAlert({
                    header: err.errCode,
                    message: err.errMessage
                });
            });
        },
        async loadingMap() {
            await this.injectMapSDK().then((isInjected: boolean) => {
                if (isInjected) {
                    this.setUserLocation();
                }
            }).catch((err: any) => {
                this.modalService.modalAlert({
                    header: err.name,
                    message: err.message
                });
            });
        },
        setMarkerOnMap(params: any): object {
            const marker = new google.maps.Marker({
                map: this.map,
                animation: google.maps.Animation.DROP,
                position: new google.maps.LatLng(params.lat, params.lng),
                icon: params.icon_url,
                title: params.description,
                label: params.description,
                anchorPoint: new google.maps.Point(39, 65),
                category: params.category,
                code: params.code,
                latitude: params.lat,
                longitude: params.lng
            });
            marker.addListener('click', (clickedLocation: any) => {
                const clickedLocat = JSON.parse(JSON.stringify(clickedLocation.latLng));
                if (marker.getAnimation() !== null) {
                    this.map.setZoom(13);
                    marker.setAnimation(null);
                    infowindow.close();
                    polyline.setMap(null);
                } else {
                    this.map.setZoom(14);
                    this.map.panTo(this.getLocationLatLng(clickedLocat.lat, clickedLocat.lng));
                    this.markerList.forEach( (marker: any) => {
                        marker.setAnimation(null);
                    });
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    this.directionsRender({lat:clickedLocat.lat, lng:clickedLocat.lng})
                }
            });
            return marker;
        },
        setMarkerLists(objectList: any[]) {
            if (objectList && objectList.length > 0) {
                let newobjectList = [];
                newobjectList = objectList.filter((branch) => branch.branchCategory === '01');
                newobjectList.forEach((itemBranch: any) => {
                    const params = {
                        code: itemBranch.branchCode,
                        lat: itemBranch.latitude,
                        lng: itemBranch.longitude,
                        icon_url: '',
                        description: '',
                        category: itemBranch.branchCategory,
                        name: itemBranch.branchNameEn
                    };
                    this.markerList.push(this.setMarkerOnMap(params));
                });
            }
        },
        userCurrentLocation() {
            this.getUserCurrentLocation().then((result: any) => {
                if ( polyline ){
                    infowindow.close();
                    polyline.setMap(null);
                }
                if (this.markerList !== null) {
                    this.markerList.forEach( (marker: any) => {
                        marker.setAnimation(null);
                    });
                }
                this.map.panTo(this.getLocationLatLng(result.lat, result.lng));
                this.map.setZoom(16);
            });
        },
        directionsRender(destination: any) {
            const directionsService = new google.maps.DirectionsService();
            this.getUserCurrentLocation().then( (result: any)=> {
                this.calculateAndDisplayRoute(directionsService,destination,result);
            } );
        },
        calculateAndDisplayRoute(directionsService: any, origin: any, destination: any) {
            directionsService.route({
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING,
            }, (response: any, status: any) => {
                console.log(response.routes[0].overview_path[Math.trunc(response.routes[0].overview_path.length/2)]);
                if (status === "OK") {
                    if (polyline) {
                        infowindow.close();
                        polyline.setMap(null);
                    }
                    polyline = new google.maps.Polyline({
                        geodesic: true,
                        strokeColor: "#3399FF",
                        strokeOpacity: 0.8,
                        strokeWeight: 5
                    });
                    const steps = response.routes[0].legs[0].steps;
                    for ( const step of steps ) {
                        const paths = step.path;
                        for ( const path of paths ) {
                            polyline.getPath().push(path);
                        }
                    }
                    polyline.setMap(this.map);
                    const distanationText = response.routes[0].legs[0].distance.text;
                    const durationText = response.routes[0].legs[0].duration.text;
                    const position = response.routes[0].overview_path[Math.trunc(response.routes[0].overview_path.length/2)];
                    this.drawInfoWindow(distanationText, durationText, position);
                }
            });
        },
        drawInfoWindow(distance: any, duration: any, position: number) {
            if ( infowindow ) {
                infowindow.close();
            }
            infowindow = new google.maps.InfoWindow();
            infowindow.setContent(
                'Distanation: ' + distance +
                '<br>'+ 'Duration: ' + duration 
            );
            infowindow.setPosition(position);
            infowindow.open(this.map);
            infowindow.addListener('closeclick', ()=>{
            // Handle focus manually.
                infowindow.close();
                polyline.setMap(null);
            });
        }
    },
    mounted() {
        this.apiKey = process.env.VUE_APP_GOOGLEMAPS_KEY ? process.env.VUE_APP_GOOGLEMAPS_KEY : '';
        this.lang = process.env.VUE_APP_I18N_LOCALE ? process.env.VUE_APP_I18N_LOCALE : '';
        this.loadingMap();
    }
}); 

</script>
<style lang="scss" >
.map {
    height: 100%;
    width: 100%;
    position: absolute;
    border-color: blue;
}

.current-btn {
    position: absolute;
    right: 0;
    background-image: url("@/assets/images/btn_gps.svg");
    background-color: transparent;
    width: 74px;
    height: 74px;
}

.direction-btn {
    position: absolute;
    min-width: 100px;
    height: 30px;
    bottom: 10%;
    --padding-start: 28px;
    font-weight: 500;
    font-size: .75rem;
    --color: #575f6b;
    --color-activated: #0060e2;
    --background-activated: #ededf4;
    --background: #edeef2;
    --border-radius: 40px;
    border-radius: 40px;
    box-shadow: -2px -2px 4px 0 rgba(255, 255, 255, 0.27), 3px 2px 5px 0 rgba(0, 0, 0, 0.4);
}
.direction-btn:before {
    content: "";
    position: absolute;
    left: 5px;
    top: 0;
    width: 20px;
    height: 100%;
    background: url("@/assets/images/ico_directions.svg") no-repeat left center;
    z-index: 5;
}
</style>