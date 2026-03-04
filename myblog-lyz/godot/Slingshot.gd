extends Node2D

# 弹弓状态
const IDLE := 0
const DRAGGING := 1
const RELEASING := 2

@export var max_drag_radius: float = 140.0
@export var min_drag_threshold: float = 14.0
@export var impulse_scale: float = 8.0
@export var max_impulse: float = 1000.0
@export var pickup_radius: float = 34.0
@export var auto_reset_delay: float = 1.6
@export var reset_bounds: Rect2 = Rect2(Vector2(-520, -320), Vector2(1040, 760))
@export var rebound_phase_1_duration: float = 0.08
@export var rebound_phase_2_duration: float = 0.09
@export var rebound_phase_3_duration: float = 0.11
@export var rebound_phase_4_duration: float = 0.14
@export var rebound_overshoot_ratio: float = 0.24
@export var rebound_backswing_ratio: float = 0.14
@export var rebound_settle_ratio: float = 0.06

@onready var anchor_left: Node2D = $AnchorLeft
@onready var anchor_right: Node2D = $AnchorRight
@onready var band_mid: Node2D = $BandMid
@onready var projectile: RigidBody2D = $Projectile
@onready var band_left_line: Line2D = $BandLeftLine
@onready var band_right_line: Line2D = $BandRightLine

var state: int = IDLE
var rest_mid: Vector2
var projectile_start_global: Vector2
var reset_timer: float = 0.0
var rebound_tween: Tween

func _ready() -> void:
	rest_mid = band_mid.global_position
	projectile_start_global = projectile.global_position
	projectile.freeze = true
	_reset_projectile()
	_update_band_visual()
	set_process(true)

func _process(delta: float) -> void:
	if state == RELEASING:
		_update_band_visual()

	if state == DRAGGING:
		return

	if not projectile.freeze:
		reset_timer -= delta
		if reset_timer <= 0.0 or not reset_bounds.has_point(projectile.global_position):
			_reset_projectile()
			state = IDLE

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
	var impulse_strength := min(drag_distance * impulse_scale, max_impulse)

	if drag_distance >= min_drag_threshold and impulse_strength > 0.0:
		projectile.freeze = false
		var impulse := offset.normalized() * impulse_strength
		projectile.apply_impulse(impulse)
		reset_timer = auto_reset_delay

	_play_rebound(dragged_mid)

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
	if rebound_tween:
		rebound_tween.kill()
		rebound_tween = null
	band_mid.global_position = rest_mid
	_update_band_visual()
	state = IDLE

	projectile.freeze = true
	projectile.global_position = projectile_start_global
	projectile.linear_velocity = Vector2.ZERO
	projectile.angular_velocity = 0.0
	reset_timer = 0.0

func _play_rebound(dragged_mid: Vector2) -> void:
	if rebound_tween:
		rebound_tween.kill()

	var travel := rest_mid - dragged_mid
	if travel.length() <= 0.001:
		band_mid.global_position = rest_mid
		_update_band_visual()
		state = IDLE
		return

	var direction := travel.normalized()
	var pull_distance := travel.length()
	var phase_1_target := rest_mid + direction * (pull_distance * rebound_overshoot_ratio)
	var phase_2_target := rest_mid - direction * (pull_distance * rebound_backswing_ratio)
	var phase_3_target := rest_mid + direction * (pull_distance * rebound_settle_ratio)

	rebound_tween = create_tween()
	rebound_tween.tween_property(band_mid, "global_position", phase_1_target, rebound_phase_1_duration).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	rebound_tween.tween_property(band_mid, "global_position", phase_2_target, rebound_phase_2_duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	rebound_tween.tween_property(band_mid, "global_position", phase_3_target, rebound_phase_3_duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	rebound_tween.tween_property(band_mid, "global_position", rest_mid, rebound_phase_4_duration).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	rebound_tween.finished.connect(_on_rebound_finished)

func _on_rebound_finished() -> void:
	rebound_tween = null
	band_mid.global_position = rest_mid
	_update_band_visual()
	state = IDLE
