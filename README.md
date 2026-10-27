# Lee's Disk Experiment — Virtual Thermal Lab

An interactive virtual physics laboratory for studying **Lee's Disk Method** and understanding heat conduction through poor thermal conductors. The project provides a digital environment for exploring thermal behavior, observing temperature changes, and learning the principles behind calculating thermal conductivity.

## 🚀 Live Demo

**[Launch Lee's Disk Virtual Lab](https://lee-s-disk-simulation.onrender.com)**

Explore the deployed prototype in your browser.

## 🖥️ Prototype Preview

Add screenshots of your deployed application to the repository using the structure below.

### Main Interface
![Lee's Disk Virtual Lab Interface](screenshots/main-interface.png)

### Experiment Simulation
![Lee's Disk Experiment Simulation](screenshots/experiment-simulation.png)

### Temperature Graph and Results
![Temperature Graph and Results](screenshots/temperature-graph.png)

> **Note:** Replace these example image paths with screenshots of your actual prototype. Create a `screenshots` folder in the repository and add the corresponding PNG files.

## 🎯 Objectives

- Understand the principle of heat conduction through poor conductors.
- Study the working of Lee's Disk apparatus.
- Observe temperature variations during heating and cooling.
- Understand the role of steady-state temperature and cooling rate.
- Learn how experimental observations help determine thermal conductivity.

## 🔬 About the Experiment

Lee's Disk Method is used to determine the thermal conductivity of materials that conduct heat poorly, such as cardboard and other insulating materials.

The experiment is based on the principle that, under steady-state conditions, the heat conducted through the specimen equals the rate of heat lost by the metallic disk, subject to the assumptions of the experimental model.

The cooling rate of the metallic disk is used to estimate the rate of heat loss.

### Fundamental equations

Heat conducted through the specimen:

\[
\frac{Q}{t} = \frac{kA(T_1-T_2)}{x}
\]

Rate of heat loss by the metallic disk:

\[
\frac{Q}{t} = mc\left|\frac{dT}{dt}\right|
\]

Therefore, under the simplified model:

\[
k = \frac{mcx}{A(T_1-T_2)}
\left|\frac{dT}{dt}\right|
\]

Where:

- \(k\) = thermal conductivity of the specimen
- \(m\) = mass of the metallic disk
- \(c\) = specific heat capacity of the disk
- \(x\) = thickness of the specimen
- \(A\) = cross-sectional area
- \(T_1-T_2\) = temperature difference across the specimen
- \(\left|dT/dt\right|\) = magnitude of the cooling rate

The exact expression used in the application may depend on its implementation and the assumptions of the simulation.

## ✨ Key Features

- **Virtual Experiment:** Explore the Lee's Disk setup digitally.
- **Thermal Concepts:** Learn about heat conduction and thermal equilibrium.
- **Temperature Analysis:** Understand temperature variation and cooling behavior.
- **Graphical Visualization:** Present temperature observations and cooling curves, where implemented.
- **Educational Accessibility:** Review experimental concepts without requiring continuous access to a physical laboratory.
- **Browser-Based Access:** Open the deployed prototype without installing a desktop application.

*Features should be adjusted to match the functionality currently implemented in the deployed version.*

## 🧪 Experimental Procedure

1. Set up the metallic disk and the specimen.
2. Apply heat using the simulated heating arrangement.
3. Allow the system to approach steady-state conditions.
4. Record the relevant temperatures.
5. Observe the cooling behavior of the metallic disk.
6. Determine the cooling rate from temperature-versus-time observations.
7. Apply the appropriate experimental equation to estimate thermal conductivity.

## 📊 Expected Learning Outcomes

After exploring the virtual lab, students should be able to:

- Explain the principle of Lee's Disk Method.
- Identify the important experimental parameters.
- Interpret temperature-versus-time graphs.
- Understand how cooling rate relates to heat transfer.
- Explain the estimation of thermal conductivity for poor conductors.

## 🛠️ Technology Stack

Update this section to reflect the actual tools and frameworks used in the project.

- **Frontend:** Add your implemented frontend framework or technologies.
- **Backend:** Add your implemented backend framework, if applicable.
- **Visualization:** Add the graphing library used, if applicable.
- **Deployment:** Render

## 🌐 Deployment

The application is deployed on Render and can be accessed here:

**Live URL:** https://lee-s-disk-simulation.onrender.com

## 📁 Suggested Repository Structure

```text
lees-disk-virtual-lab/
├── screenshots/
│   ├── main-interface.png
│   ├── experiment-simulation.png
│   └── temperature-graph.png
├── README.md
├── requirements.txt
└── application files
```

The structure is illustrative; retain your project's actual filenames and directories.

## 🎓 Applications

- Engineering physics laboratory practice
- Virtual laboratory demonstrations
- Heat transfer and thermodynamics education
- Understanding experimental graphs and measurements

## ⚠️ Disclaimer

This project is intended for educational and simulation purposes. Simulated readings should not be presented as real experimental measurements unless independently verified using physical apparatus.

## 👨‍💻 Author

Developed as a virtual laboratory project to make engineering physics experiments more accessible and interactive.

---

**Explore the experiment:** [Lee's Disk Virtual Lab](https://lee-s-disk-simulation.onrender.com)
