import logging
import logging.handlers
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response


class _ColoredFormatter(logging.Formatter):
	_COLORS = {
		"DEBUG": "\033[36m",
		"INFO": "\033[32m",
		"WARNING": "\033[33m",
		"ERROR": "\033[31m",
		"CRITICAL": "\033[35m",
		"RESET": "\033[0m",
	}

	def format(self, record: logging.LogRecord) -> str:
		color = self._COLORS.get(record.levelname, self._COLORS["RESET"])
		reset = self._COLORS["RESET"]
		record.levelname = f"{color}{record.levelname}{reset}"
		return super().format(record)


def setup_logging(
	log_level: Optional[str] = None,
	log_dir: Optional[str] = None,
	console: bool = True,
	files: bool = True,
) -> None:
	from datetime import datetime
	
	level = (log_level or os.getenv("LOG_LEVEL", "INFO")).upper()
	log_path = Path(log_dir or os.getenv("LOG_DIR", "logs"))
	
	log_path.mkdir(parents=True, exist_ok=True)

	root = logging.getLogger()
	root.setLevel(getattr(logging, level, logging.INFO))
	root.handlers.clear()

	fmt = '%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s'
	datefmt = '%Y-%m-%d %H:%M:%S'
	formatter = logging.Formatter(fmt=fmt, datefmt=datefmt)
	color_formatter = _ColoredFormatter(fmt=fmt, datefmt=datefmt)

	if console:
		ch = logging.StreamHandler(sys.stdout)
		ch.setLevel(getattr(logging, level, logging.INFO))
		ch.setFormatter(color_formatter)
		root.addHandler(ch)

	if files:
		today = datetime.now().strftime('%Y-%m-%d')
		
		app_file = log_path / f'{today}.log'
		error_file = log_path / f'{today}.log'  # Same file for errors
		
		# Main app log file (all levels)
		fh = logging.handlers.TimedRotatingFileHandler(
			str(app_file), 
			when='midnight', 
			interval=1, 
			backupCount=30,  # Keep 30 days
			encoding='utf-8'
		)
		fh.setLevel(getattr(logging, level, logging.INFO))
		fh.setFormatter(formatter)
		root.addHandler(fh)

		# Error log file (errors only)
		eh = logging.handlers.TimedRotatingFileHandler(
			str(error_file), 
			when='midnight', 
			interval=1, 
			backupCount=30,
			encoding='utf-8'
		)
		eh.setLevel(logging.ERROR)
		eh.setFormatter(formatter)
		root.addHandler(eh)

	logger = logging.getLogger("app")
	logger.info("Logging system initialized")
	logger.info(f"Log level: {level}")
	logger.info(f"Log directory: {log_path}")
	logger.info(f"Daily log files: {today}.log")
	
	# Ensure HTTP logger also writes to files
	http_logger = logging.getLogger("http")
	http_logger.setLevel(getattr(logging, level, logging.INFO))
	# HTTP logger inherits handlers from root logger, so it should write to files


class RequestLoggingMiddleware(BaseHTTPMiddleware):
	"""Logs every HTTP request/response with timings and sizes."""
	def __init__(self, app: ASGIApp):
		super().__init__(app)
		self.logger = logging.getLogger("http")
		# Ensure the http logger inherits from root logger
		self.logger.setLevel(logging.INFO)

	async def dispatch(self, request: Request, call_next) -> Response:
		request_id = str(uuid.uuid4())[:8]
		start = time.time()
		method = request.method
		url = str(request.url)
		client_ip = request.client.host if request.client else "unknown"
		ua = request.headers.get("user-agent", "unknown")
		self.logger.info(f"[{request_id}] {method} {url} | IP: {client_ip} | User-Agent: {ua}")
		try:
			response = await call_next(request)
		except Exception as exc:
			elapsed = time.time() - start
			self.logger.error(f"[{request_id}] {method} {url} | ERROR: {exc} | Time: {elapsed:.3f}s")
			raise
		elapsed = time.time() - start
		status = response.status_code
		size = response.headers.get("content-length", "unknown")
		if status >= 500:
			log = self.logger.error
		elif status >= 400:
			log = self.logger.warning
		else:
			log = self.logger.info
		log(f"[{request_id}] {method} {url} | Status: {status} | Time: {elapsed:.3f}s | Size: {size} bytes")
		response.headers["X-Request-ID"] = request_id
		return response


def install_logging(app) -> None:
	"""Attach HTTP logging middleware to a FastAPI app."""
	app.add_middleware(RequestLoggingMiddleware)


def get_logger(name: str) -> logging.Logger:
	return logging.getLogger(name)
