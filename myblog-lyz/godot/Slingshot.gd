extends Node2D

const IDLE := 0
const DRAGGING := 1
const RELEASING := 2

const DEFAULT_RECOIL_DURATIONS := PackedFloat32Array([0.07, 0.09, 0.11, 0.14])
const DEFAULT_RECOIL_RATIOS := PackedFloat32Array([0.22, 0.11, 0.045])

@export_group("Launch")
@export var max_drag_radius: float = 140.0
@export var min_drag_threshold: float = 14.0
@export var impulse_scale: float = 8.0
@export var max_impulse: float = 1000.0
@export var pickup_radius: float = 28.0
@export var auto_reset_delay: float = 1.8
@export var reset_bounds: Rect2 = Rect2(Vector2(-520, -320), Vector2(1040, 760))

@export_group("Band Recoil")
@export var recoil_segment_durations: PackedFloat32Array = DEFAULT_RECOIL_DURATIONS
@export var recoil_amplitude_ratios: PackedFloat32Array = DEFAULT_RECOIL_RATIOS

@onready var anchor_left: Node2D = $AnchorLeft
@onready var anchor_right: Node2D = $AnchorRight
@onready var band_mid: Node2D = $BandMid
@onready var projectile: RigidBody2D = $Projectile
@onready var band_left_line: Line2D = $BandLeftLine
@onready var band_right_line: Line2D = $BandRightLine
@onready var reset_timer_node: Timer = $ResetTimer

var state: int = IDLE
var rest_mid: Vector2
var projectile_start_global: Vector2
var band_recoil_tween: Tween

func _ready() -> void:
	rest_mid = band_mid.global_position
	projectile_start_global = projectile.global_position
	projectile.freeze = true
	reset_timer_node.wait_time = auto_reset_delay
	reset_timer_node.one_shot = true
	reset_timer_node.timeout.connect(_reset_projectile)
	_reset_projectile()
	set_process(true)

func _process(_delta: float) -> void:
	if not projectile.freeze and not reset_bounds.has_point(projectile.global_position):
		_reset_projectile()
		return

	_update_band_visual()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			if state == IDLE and _can_start_drag(event.position):
				_stop_band_recoil()
				state = DRAGGING
				_update_drag(event.position)
		elif state == DRAGGING:
			_release_slingshot()
	elif event is InputEventMouseMotion and state == DRAGGING:
		_update_drag(event.position)

func _update_drag(mouse_pos: Vector2) -> void:
	var drag_offset := mouse_pos - rest_mid
	if drag_offset.length() > max_drag_radius:
		drag_offset = drag_offset.normalized() * max_drag_radius

	band_mid.global_position = rest_mid + drag_offset
	projectile.freeze = true
	projectile.global_position = band_mid.global_position
	projectile.linear_velocity = Vector2.ZERO
	projectile.angular_velocity = 0.0
	_update_band_visual()

func _release_slingshot() -> void:
	state = RELEASING
	var release_mid := band_mid.global_position
	var offset := rest_mid - release_mid
	var drag_distance := offset.length()
	var impulse_strength := minf(drag_distance * impulse_scale, max_impulse)

	if drag_distance >= min_drag_threshold and impulse_strength > 0.0:
		projectile.freeze = false
		projectile.linear_velocity = Vector2.ZERO
		projectile.angular_velocity = 0.0
		projectile.apply_impulse(offset.normalized() * impulse_strength)
		reset_timer_node.start(auto_reset_delay)
	else:
		projectile.freeze = true

	_start_band_recoil(release_mid)

func _start_band_recoil(release_mid: Vector2) -> void:
	_stop_band_recoil()
	band_mid.global_position = release_mid

	var recoil_targets := _build_recoil_targets(release_mid)
	band_recoil_tween = create_tween()

	band_recoil_tween.tween_property(
		band_mid,
		"global_position",
		recoil_targets[0],
		_get_recoil_duration(0)
	).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_OUT)

	band_recoil_tween.tween_property(
		band_mid,
		"global_position",
		recoil_targets[1],
		_get_recoil_duration(1)
	).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

	band_recoil_tween.tween_property(
		band_mid,
		"global_position",
		recoil_targets[2],
		_get_recoil_duration(2)
	).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

	band_recoil_tween.tween_property(
		band_mid,
		"global_position",
		recoil_targets[3],
		_get_recoil_duration(3)
	).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

	band_recoil_tween.finished.connect(_on_band_recoil_finished)

func _build_recoil_targets(release_mid: Vector2) -> Array[Vector2]:
	var release_offset := release_mid - rest_mid
	return [
		rest_mid - release_offset * _get_recoil_ratio(0),
		rest_mid + release_offset * _get_recoil_ratio(1),
		rest_mid - release_offset * _get_recoil_ratio(2),
		rest_mid
	]

func _get_recoil_duration(index: int) -> float:
	if index < recoil_segment_durations.size():
		return maxf(recoil_segment_durations[index], 0.01)
	return DEFAULT_RECOIL_DURATIONS[min(index, DEFAULT_RECOIL_DURATIONS.size() - 1)]

func _get_recoil_ratio(index: int) -> float:
	if index < recoil_amplitude_ratios.size():
		return maxf(recoil_amplitude_ratios[index], 0.0)
	return DEFAULT_RECOIL_RATIOS[min(index, DEFAULT_RECOIL_RATIOS.size() - 1)]

func _on_band_recoil_finished() -> void:
	band_recoil_tween = null
	band_mid.global_position = rest_mid
	if projectile.freeze:
		state = IDLE
	_update_band_visual()

func _stop_band_recoil() -> void:
	if band_recoil_tween != null:
		band_recoil_tween.kill()
		band_recoil_tween = null

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
	_stop_band_recoil()
	reset_timer_node.stop()
	state = IDLE
	projectile.freeze = true
	projectile.global_position = projectile_start_global
	projectile.linear_velocity = Vector2.ZERO
	projectile.angular_velocity = 0.0
	projectile.rotation = 0.0
	band_mid.global_position = rest_mid
	_update_band_visual()
