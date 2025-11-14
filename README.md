# hiki-server

A lightweight Node.js + TypeScript server built with **Express**, designed to provide a clean and scalable backend structure for future expansion.

---

## 🚀 Features

* **Express 5** backend
* **TypeScript** support
* **Environment variables** using `dotenv`
* **CORS** enabled
* Development with **nodemon** + **ts-node**
* Preconfigured linting & formatting with **ESLint** and **Prettier**

---

## 📁 Project Structure

```
hiki-server/
├── src/
│   ├── server.ts            # Application entry point
│   ├── routes/              # Route definitions
│   ├── controllers/         # Request handlers
│   └── middlewares/         # Custom middleware
├── dist/                    # Compiled JavaScript
├── package.json
└── tsconfig.json
```

---

## 🛠️ Installation

```bash
git clone https://github.com/nguynninh/hiki-server.git
cd hiki-server
npm install
```

---

🔧 Environment Variables

Create a .env file by copying the example file provided:

``` bash
cp .env.example .env
```

After copying, update the values inside .env according to your configuration:

```bash
PORT=3001
API_PREFIX=/api/v1
NODE_ENV=development
```


Add or modify more environment variables depending on your needs.

## 🧩 Scripts

### Start development server

```bash
npm run dev
```

### Build project

```bash
npm run build
```

### Run production server

```bash
npm start
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 📬 Contact

* **Issues**: [https://github.com/nguynninh/hiki-server/issues](https://github.com/nguynninh/hiki-server/issues)
* **Repository**: [https://github.com/nguynninh/hiki-server](https://github.com/nguynninh/hiki-server)
