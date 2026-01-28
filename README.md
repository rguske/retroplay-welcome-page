# Website for Roberts Fun Project - Retroplay Online

- [Website for Roberts Fun Project - Retroplay Online](#website-for-roberts-fun-project---retroplay-online)
  - [Intro](#intro)
  - [Containerfile](#containerfile)
  - [Build the Container Multi-Arch (arm64 + amd64)](#build-the-container-multi-arch-arm64--amd64)
    - [Push the Container Image](#push-the-container-image)
    - [Run the Container](#run-the-container)
  - [Run it on OpenShift/Kubernetes](#run-it-on-openshiftkubernetes)
    - [ServiceAccount](#serviceaccount)
    - [Deployment](#deployment)
    - [Optional: Knative Service](#optional-knative-service)
    - [Update Image Ref for the Knative Service](#update-image-ref-for-the-knative-service)

## Intro

This is running cleanly on Kubernetes and meets my UI requirements:

* Adjustable background (via UI controls and/or environment variables)
* Left navigation pane with configurable external links, with “active/highlighted” state
* Nerdy retro 80s gaming font (e.g., “Press Start 2P”)

It’ll load a global `window.APP_CONFIG` from `/config.js`. That file is generated at container start from environment variables, so Kubernetes can control it via `ConfigMap/Env`.

`public/config.template.js`

```js
// This file is rendered into /usr/share/nginx/html/config.js at container startup.
window.APP_CONFIG = {
  background: {
    mode: "${BG_MODE}",
    solid: "${BG_SOLID}",
    gradientFrom: "${BG_GRAD_FROM}",
    gradientTo: "${BG_GRAD_TO}",
    imageUrl: "${BG_IMAGE_URL}"
  },
  navLinks: ${NAV_LINKS_JSON},

  textBox: {
    title: "${TEXTBOX_TITLE}",          // e.g. "NOTES"
    placeholder: "${TEXTBOX_PLACEHOLDER}", // e.g. "Type something retro..."
    defaultText: "${TEXTBOX_DEFAULT}"   // e.g. "WELCOME, PLAYER ONE."
  }
};
```

```code
tree -L 2
.
├── Containerfile
├── index.html
├── kubernetes
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── ksvc.yaml
│   ├── route.yaml
│   └── service.yaml
├── nginx
│   ├── default.conf
│   └── entrypoint.sh
├── node_modules
│   ├── @babel
│   ├── @esbuild
│   ├── @jridgewell
│   ├── @rolldown
│   ├── @rollup
│   ├── @types
│   ├── @vitejs
│   ├── baseline-browser-mapping
│   ├── browserslist
│   ├── caniuse-lite
│   ├── convert-source-map
│   ├── debug
│   ├── electron-to-chromium
│   ├── esbuild
│   ├── escalade
│   ├── gensync
│   ├── js-tokens
│   ├── jsesc
│   ├── json5
│   ├── loose-envify
│   ├── lru-cache
│   ├── ms
│   ├── nanoid
│   ├── node-releases
│   ├── picocolors
│   ├── postcss
│   ├── react
│   ├── react-dom
│   ├── react-refresh
│   ├── rollup
│   ├── scheduler
│   ├── semver
│   ├── source-map-js
│   ├── update-browserslist-db
│   ├── vite
│   └── yallist
├── package-lock.json
├── package.json
├── public
│   └── config.template.js
├── README.md
├── src
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
└── vite.config.js
```

## Containerfile

```code
# Build stage
#FROM node:20-alpine AS build
FROM registry.access.redhat.com/ubi9/nodejs-20:9.7 AS build
LABEL maintainer="Robert Guske"
LABEL description="Fun Project - Retroplay Online Lab Website"
WORKDIR /app

# Fix Permissions
RUN fix-permissions /app -P

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM registry.access.redhat.com/ubi9/nginx-120

USER 0

# Replace the base nginx.conf that contains its own default server
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Your vhost
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY --chown=1001:0 nginx/entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

# Static assets (match the root above)
COPY --from=build --chown=1001:0 /app/dist/ /usr/share/nginx/html/

USER 1001
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
```

What `fix-permissions` actually does (important). In UBI / OpenShift images, fix-permissions:

* Recursively sets:
  * g+rwX
  * o-rwx
* Ensures files are writable by group 0

It does NOT:

* Make files executable if they weren’t already
* Override mount permissions
* Fix architecture mismatches
* Fix CRLF line endings
* Fix ENTRYPOINT pointing to a non-executable file

## Build the Container Multi-Arch (arm64 + amd64)

```code
podman manifest create retroplay-welcome
```

Create Multi-Arch Image:

```code
podman build --platform linux/arm64,linux/amd64 --manifest retroplay-welcome .
```

Inspect build:

```code
podman manifest inspect retroplay-welcome
```

```json
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.index.v1+json",
    "manifests": [
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "size": 1682,
            "digest": "sha256:264965c0a99969f7d66910e116e021a250d2a74043f3af5d47f50f5de5f5704b",
            "platform": {
                "architecture": "amd64",
                "os": "linux"
            }
        },
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "size": 1682,
            "digest": "sha256:d45081bb7e5a4519e53c7a505955affdd2b1896a8839902927f2e8b8774304f9",
            "platform": {
                "architecture": "arm64",
                "os": "linux"
            }
        }
    ]
}
```

List created images:

```code
podman images
REPOSITORY                                 TAG         IMAGE ID      CREATED        SIZE
<none>                                     <none>      cacccc284369  2 minutes ago  400 MB
<none>                                     <none>      442f3c707165  2 minutes ago  716 MB
<none>                                     <none>      86b4c55835b8  3 minutes ago  382 MB
<none>                                     <none>      a68d8fe43e34  3 minutes ago  708 MB
localhost/retroplay-welcome                latest      e34dc47a896e  4 minutes ago  1.17 kB
registry.access.redhat.com/ubi9/nodejs-20  9.7         bf23c8b9fdef  36 hours ago   624 MB
registry.access.redhat.com/ubi9/nginx-120  latest      1efa11ba4723  36 hours ago   399 MB
```

### Push the Container Image

```code
podman manifest push localhost/retroplay-welcome quay.io/rguske/retroplay-welcome:v1.0
```

### Run the Container

```code
podman run -p 8080:8080 \
  -e BG_MODE=image \
  -e BG_IMAGE_URL="https://raw.githubusercontent.com/rguske/jarvislab/main/assets/retroplayonline-logo.png" \
  -e NAV_LINKS_JSON='[{"label":"Pacman","url":"https://pacman-pacman.apps.ocp-mk42.retroplay.guske.io/"},{"label":"Read VM CMDB","url":"https://postgresql-read-webapp-postgres.apps.ocp-mk42.retroplay.guske.io/"},{"label":"Blog Robert Guske","url":"https://rguske.github.io"},{"label":"CNCF","url":"https://www.cncf.io"}]' \
  quay.io/rguske/retroplay-welcome:v1.0
```

## Run it on OpenShift/Kubernetes

### ServiceAccount

Create a `ServiceAccount` which will be sued for the deployment.

```code
oc create sa retro-webapp
```

Update the deployment manifest accordingly:

```code
spec:
  template:
    spec:
      serviceAccountName: retro-webapp
```

Create the `scc`:

```code
oc adm policy add-scc-to-user anyuid -z retro-webapp
```

If no `ServiceAccount` is provided, the container will fail starting. Another easy way to go is by applying the `scc` policy to the default user which exists in every `namespace`.

```code
oc adm policy add-scc-to-user anyuid -z default
```

Implications:

* Grants the anyuid Security Context Constraint to the default ServiceAccount
* Allows containers using that ServiceAccount to:
  * Run as root (UID 0) or any arbitrary UID
  * Bypass OpenShift’s default non-root enforcement
  * Effectively disables one of OpenShift’s core security protections for all pods using default in that namespace


### Deployment

Apply the following manifest files or create an ArgoCD Application.

```code
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/route.yaml
```

The `kubernetes` directory also includes an `ingress.yaml` example.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: retro-webapp
spec:
  rules:
    - host: retro.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: retro-webapp
                port:
                  number: 80
```

### Optional: Knative Service

Since I'm a big fan of [Knative](https://knative.dev), a Knative Service (`ksvc`) example is also included:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: home
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '5'
        autoscaling.knative.dev/minScale: '1'
    spec:
      containerConcurrency: 0
      containers:
        - envFrom:
            - configMapRef:
                name: retro-webapp-config
          image: 'quay.io/rguske/retroplay-welcome:v1.0'
          imagePullPolicy: Always
          name: retroplay-ksvc
          ports:
            - containerPort: 8080
              protocol: TCP
          resources:
            limits:
              cpu: 500m
              memory: 512Mi
            requests:
              cpu: 100m
              memory: 128Mi
```

Create the Knative Service (`ksvc`) declarative:

```code
kn service create home \
 --image=quay.io/rguske/retroplay-welcome:v1.0 \
 --env-from cm:retro-webapp-config \
 --scale-min=0 \
 --scale-max=5
```

### Update Image Ref for the Knative Service

If you've created a new version of the app, just update the `revision` of the `ksvc`:

```code
kn service list
NAME   URL                                                              LATEST       AGE     CONDITIONS   READY   REASON
home   https://home-retroplay-online.apps.ocp-mk42.retroplay.guske.io   home-00003   5d20h   3 OK / 3     True
```

```code
kn service update home --image quay.io/rguske/retroplay-welcome:v1.0
```

```code
kn service list
NAME   URL                                                              LATEST       AGE     CONDITIONS   READY   REASON
home   https://home-retroplay-online.apps.ocp-mk42.retroplay.guske.io   home-00004   5d20h   3 OK / 3     True
```
