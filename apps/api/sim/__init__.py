"""GreenWave simulation package — a lightweight spatial-queue traffic micro-simulation.

Self-contained (pure standard library): no SUMO, no NumPy, no API keys required.
See ../../../03-TRD.md for the design rationale.
"""
from .network import GridNetwork
from .controllers import FixedController, MaxPressureController
from .simulation import Simulation, Vehicle

__all__ = [
    "GridNetwork",
    "FixedController",
    "MaxPressureController",
    "Simulation",
    "Vehicle",
]
