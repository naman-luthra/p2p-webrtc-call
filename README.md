# P2P WebRTC Video Call Application

Welcome to the P2P WebRTC Video Call application! This open-source project is built using WebRTC, Next.js, and TypeScript. It enables users to make peer-to-peer video calls with a custom layout algorithm for arranging video tiles. In this README, we'll provide an overview of the application and a detailed description of the custom layout algorithm used in `utils/layout.ts`.

## Overview

This P2P WebRTC Video Call application allows users to establish secure, real-time video calls directly between their web browsers. It's built on top of WebRTC, a powerful technology for real-time communication, and leverages the Next.js framework for the frontend and TypeScript for robust type checking.

## Features

- **Peer-to-Peer Video Calls:** Establish video calls directly between two users without the need for any central server.
- **Custom Layout Algorithm:** A custom layout algorithm arranges video tiles dynamically, providing an optimal viewing experience.
- **WebRTC:** Utilizes WebRTC for its underlying technology, ensuring high-quality, low-latency video communication.
- **Modern Web Technologies:** Developed using Next.js and TypeScript, making the application maintainable and extensible.
- **User-Friendly Interface:** Provides an intuitive and user-friendly interface for initiating and managing video calls.

## Getting Started

To run this application locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/naman-luthra/p2p-webrtc-call.git
   cd p2p-webrtc-call

2. Install the dependencies:
   
   ```bash
   npm install

3. Start the application:

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation and Configuration

For more detailed instructions and configuration options, please refer to the application's [documentation](#) (coming soom!).

## Custom Layout Algorithm

One of the standout features of this application is the custom layout algorithm used to arrange video tiles. The algorithm can be found in the `utils/layout.ts` file. This algorithm dynamically arranges video tiles based on the number of participants and the available screen space.

The key aspects of the custom layout algorithm include:

- **Automatic Grid Sizing:** The algorithm intelligently calculates the number of rows and columns for the grid, depending on the number of video participants.
- **Optimal Video Tile Placement:** It ensures that video tiles are evenly distributed, making the best use of the available screen space.
- **Responsive Design:** The layout adjusts itself based on the screen size, ensuring that the video tiles are well-organized regardless of the device or window size.

Feel free to explore the code in `utils/layout.ts` for more details and to customize the algorithm to suit your specific needs.

## Contributing

We welcome contributions from the open-source community. If you have ideas for improvements or new features, please open an issue or submit a pull request. Check out our [Contribution Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
