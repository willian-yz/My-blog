extends Node2D

const IDLE := 0
const DRAGGING := 1
const RELEASING := 2

@export var max_drag_radius: float = 140.0
@export var min_drag_threshold: float = 14.0
@export var impulse_scale: float = 8.0
@export var max_impulse: float = 1000.0
@export var pickup_radius: float = 34.0
@export var auto_reset_delay: float = 1.8
@export var out_of_bounds_distance: float = 980.0

@onready var anchor_left: Node2D = $AnchorLeft
@onready var anchor_right: Node2D = $AnchorRight
@onready var band_mid: Node2D = $BandMid
@onready var projectile: RigidBody2D = $Projectile
@onready var band_left_line: Line2D = $BandLeftLine
@onready var band_right_line: Line2D = $BandRightLine
@onready var reset_timer: Timer = $ResetTimer

var state: int = IDLE
var rest_mid: Vector2
var projectile_start_global: Vector2

func _ready() -> void:
	rest_mid = band_mid.global_position
	projectile_start_global = projectile.global_position
	projectile.freeze = true
	reset_timer.wait_time = auto_reset_delay
	reset_timer.one_shot = true
	reset_timer.timeout.connect(_reset_projectile)
	_reset_projectile()
	_update_band_visual()

func _physics_process(_delta: float) -> void:
	if projectile.freeze:
		return

	if projectile.global_position.distance_to(projectile_start_global) > out_of_bounds_distance:
		_reset_projectile()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			if state == IDLE and _can_start_drag(event.position):
				state = DRAGGING
				_update_drag(event.position)
		else:
			if state == DRAGGING:
				_release_slingshot()
	elif event is InputEventMouseMotion and state == DRAGGING:
		_update_drag(event.position)

func _update_drag(mouse_pos: Vector2) -> void:
	var delta := mouse_pos - rest_mid
	if delta.length() > max_drag_radius:
		delta = delta.normalized() * max_drag_radius
	band_mid.global_position = rest_mid + delta
	projectile.freeze = true
	projectile.global_position = band_mid.global_position
	projectile.linear_velocity = Vector2.ZERO
	projectile.angular_velocity = 0.0
	_update_band_visual()

func _release_slingshot() -> void:
	state = RELEASING
	var dragged_mid := band_mid.global_position
	var offset := rest_mid - dragged_mid
	var drag_distance := offset.length()
	var impulse_strength: float = minf(drag_distance * impulse_scale, max_impulse)

	if drag_distance >= min_drag_threshold and impulse_strength > 0.0:
		projectile.freeze = false
		var impulse: Vector2 = offset.normalized() * impulse_strength
		projectile.apply_impulse(impulse)
		reset_timer.start()

	# Reset the rubber band immediately after release while the projectile flies on.
	band_mid.global_position = rest_mid
	_update_band_visual()
	state = IDLE

func _can_start_drag(mouse_pos: Vector2) -> bool:
	return mouse_pos.distance_to(band_mid.global_position) <= pickup_radius

func _update_band_visual() -> void:
	band_left_line.clear_points()
	band_left_line.add_point(to_local(anchor_left.global_position))
	band_left_line.add_point(to_local(band_mid.global_position))

	band_right_line.clear_points()
	band_right_line.add_point(to_local(anchor_right.global_position))
	band_right_line.add_point(to_local(band_mid.global_position))

func _reset_projectile() -> void:
	reset_timer.stop()
	state = IDLE
	projectile.freeze = true
	projectile.global_position = projectile_start_global
	projectile.linear_velocity = Vector2.ZERO
	projectile.angular_velocity = 0.0
	band_mid.global_position = rest_mid
	_update_band_visual()
